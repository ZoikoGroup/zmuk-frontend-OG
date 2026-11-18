"use client";

import {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    ReactNode,
} from "react";
import { getPlans as getPublicSectorPlans, getToken as getPsToken } from "../civilservants/publicSectorApi";
import type { DiscountedPrices } from "../civilservants/publicSectorApi";
import { getStudentPlans } from "../student-deals/studentApi";

export interface CartItem {
    cartKey: string;

    id: number;

    type: "plan" | "product";

    name: string;
    slug?: string;

    image?: string;
    category?: string;

    price: number;

    quantity: number;

    metadata?: Record<string, any>;
}

// interface CartContextType {
//   cart: CartItem[];

//   addToCart: (item: CartItem) => void;

//   removeFromCart: (cartKey: string) => void;

//   updateQuantity: (
//     cartKey: string,
//     quantity: number
//   ) => void;

//   clearCart: () => void;

//   totalItems: number;

//   totalPrice: number;
// }


// Contract terms. Days are what the server uses to pick the price (730 = price_24, ...).
export type PlanTerm = "24M" | "12M" | "30D";
export const PLAN_TERM_DAYS = { "24M": 730, "12M": 365, "30D": 30 } as const;
export const PLAN_TERM_FIELD = { "24M": "price_24", "12M": "price_12", "30D": "price_30" } as const;

interface CartContextType {
    cart: CartItem[];

    addToCart: (item: CartItem) => void;

    addPlanToCart: (plan: any, simType?: "esim" | "psim", term?: PlanTerm) => void;

    addProductToCart: (
        product: any,
        options?: {
            condition?: string;
            storage?: string;
            color?: string;
            price?: number;
        }
    ) => void;

    removeFromCart: (cartKey: string) => void;

    updateQuantity: (
        cartKey: string,
        quantity: number
    ) => void;

    clearCart: () => void;

    /** Apply the server's prices after a 409 PRICE_CHANGED. Keys are cartKeys. */
    updateLinePrices: (prices: Record<string, number>) => void;

    totalItems: number;

    totalPrice: number;

    /** True once the cart has been loaded from localStorage on the client. */
    hydrated: boolean;

    /** True when any plan line carries the public sector discount (coupons can't be combined). */
    hasPublicSectorDiscount: boolean;
}

/** Term price field the server uses for a duration in days. */
function fieldForDuration(days: unknown): "price_24" | "price_12" | "price_30" | null {
    const d = Number(days);
    return d === 730 ? "price_24" : d === 365 ? "price_12" : d === 30 ? "price_30" : null;
}

/** Public sector discounted price for a plan line, or null if the plan has no discount. */
function discountedUnitPrice(
    map: Record<number, DiscountedPrices>,
    planId: number,
    days: unknown
): number | null {
    const d = map[planId];
    if (!d) return null;
    const field = fieldForDuration(days);
    const raw = (field ? d[field] : null) ?? d.price;
    const n = Number(raw);
    return raw != null && Number.isFinite(n) ? n : null;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "cart";

/**
 * Make whatever is in localStorage safe to use as CartItem[].
 * Older code wrote items without a `cartKey` and with `qty` instead of
 * `quantity`; without this, those items could never be removed or updated.
 */
function sanitizeStoredCart(raw: unknown): CartItem[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter(
            (item): item is Record<string, any> =>
                !!item && typeof item === "object" && item.id != null
        )
        .map((item, index) => {
            const { qty, ...rest } = item;
            const quantity =
                Math.max(1, Math.floor(Number(rest.quantity ?? qty ?? 1)) || 1);

            return {
                ...rest,
                cartKey:
                    typeof rest.cartKey === "string" && rest.cartKey
                        ? rest.cartKey
                        : `${rest.type ?? "item"}-${rest.id}-${index}`,
                quantity,
                price: Number(rest.price) || 0,
            } as CartItem;
        });
}

function readStoredCart(): CartItem[] {
    try {
        return sanitizeStoredCart(
            JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
        );
    } catch {
        return [];
    }
}

export function CartProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Load cart from localStorage once, on the client.
    useEffect(() => {
        setCart(readStoredCart());
        setHydrated(true);
    }, []);

    // Save cart whenever it changes — but never before the initial load,
    // otherwise the empty initial state would overwrite the stored cart.
    useEffect(() => {
        if (!hydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        } catch {
            /* storage full / blocked — keep the in-memory cart */
        }
    }, [cart, hydrated]);

    // Public sector discount map: planId -> discounted prices. Only filled for an approved worker.
    const [psDiscounts, setPsDiscounts] = useState<Record<number, DiscountedPrices>>({});
    const psRequest = useRef(0);

    const loadPsDiscounts = useCallback(async () => {
        const request = ++psRequest.current;
        if (!getPsToken()) {
            setPsDiscounts({});
            return;
        }
        try {
            // Public sector (30%) and student (20%) discounts share one map; a failure in one
            // programme must not hide the other.
            const [ps, student] = await Promise.all([
                getPublicSectorPlans().catch(() => null),
                getStudentPlans().catch(() => null),
            ]);
            if (request !== psRequest.current) return;
            const map: Record<number, DiscountedPrices> = {};
            [ps, student].forEach((data) => {
                if (!data?.discount_applies) return;
                data.plans.forEach((p) => {
                    if (p.discounted_prices) map[p.id] = p.discounted_prices;
                });
            });
            setPsDiscounts(map);
        } catch {
            if (request === psRequest.current) setPsDiscounts({});
        }
    }, []);

    // Load on start, and again when the user logs in or out.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadPsDiscounts();
        const onAuth = () => loadPsDiscounts();
        window.addEventListener("zoiko-auth", onAuth);
        window.addEventListener("storage", onAuth);
        return () => {
            window.removeEventListener("zoiko-auth", onAuth);
            window.removeEventListener("storage", onAuth);
        };
    }, [loadPsDiscounts]);

    // Re-price the plan lines already in the cart whenever the map changes.
    useEffect(() => {
        if (!hydrated) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart((prev) => {
            let changed = false;
            const next = prev.map((item) => {
                const base = item.metadata?.basePrice;
                if (item.type !== "plan" || typeof base !== "number") return item;
                const discounted = discountedUnitPrice(psDiscounts, item.id, item.metadata?.duration);
                const price = discounted ?? base;
                const flag = discounted !== null;
                if (price === item.price && flag === !!item.metadata?.publicSectorDiscount) return item;
                changed = true;
                return { ...item, price, metadata: { ...item.metadata, publicSectorDiscount: flag } };
            });
            return changed ? next : prev;
        });
    }, [psDiscounts, hydrated]);

    // Keep multiple tabs in sync (the "storage" event only fires in OTHER tabs).
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY || e.key === null) {
                setCart(readStoredCart());
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find(
                (cartItem) => cartItem.cartKey === item.cartKey
            );

            if (existing) {
                return prev.map((cartItem) =>
                    cartItem.cartKey === item.cartKey
                        ? {
                            ...cartItem,
                            quantity: cartItem.quantity + item.quantity,
                        }
                        : cartItem
                );
            }

            return [...prev, item];
        });
    };

    // The server prices a plan line from the term in days (730 / 365 / 30) using the
    // same field rule below, so price and duration must always come from the same term.
    // Callers that don't pass a term keep the old behaviour (final_price + duration_days).
    const addPlanToCart = (plan: any, simType: "esim" | "psim" = "psim", term?: PlanTerm) => {
        const duration = term ? PLAN_TERM_DAYS[term] : plan.duration_days;
        const basePrice = term
            ? Number(plan[PLAN_TERM_FIELD[term]] ?? plan.price)
            : Number(plan.final_price ?? plan.price);
        // Verified public sector workers pay 30% less on the offer plans, from any page.
        const discounted = discountedUnitPrice(psDiscounts, plan.id, duration);
        const price = discounted ?? basePrice;

        const cartItem: CartItem = {
            cartKey: `plan-${plan.id}-${duration}-${simType}`,

            id: plan.id,

            type: "plan",

            name: plan.name,

            slug: plan.slug,

            image: plan.og_image ?? "",

            category: plan.category?.name,

            price,

            quantity: 1,

            metadata: {
                simType: simType,
                duration,
                dataAllowance: plan.data_allowance,
                transatelID: plan.transatelID,
                tier: plan.tier_label,
                // Normal price, so the line can switch back if the user logs out.
                basePrice,
                publicSectorDiscount: discounted !== null,
            },
        };

        addToCart(cartItem);
    };

    const addProductToCart = (
        product: any,
        options?: {
            condition?: string;
            storage?: string;
            color?: string;
            price?: number;
        }
    ) => {
        const cartItem: CartItem = {
            cartKey: `product-${product.id}-${options?.condition ?? ""}-${options?.storage ?? ""}-${options?.color ?? ""}`,

            id: product.id,

            type: "product",

            name: product.name,

            slug: product.slug,

            image: product.primary_image,

            category: product.category?.name,

            price:
                options?.price ??
                Number(product.price_min),

            quantity: 1,

            metadata: {
                brand: product.brand,

                condition: options?.condition,

                storage: options?.storage,

                color: options?.color,
            },
        };

        addToCart(cartItem);
    };

    const removeFromCart = (cartKey: string) => {
        setCart((prev) =>
            prev.filter((item) => item.cartKey !== cartKey)
        );
    };

    const updateQuantity = (
        cartKey: string,
        quantity: number
    ) => {
        if (quantity <= 0) {
            removeFromCart(cartKey);
            return;
        }

        setCart((prev) =>
            prev.map((item) =>
                item.cartKey === cartKey
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const updateLinePrices = (prices: Record<string, number>) => {
        setCart((prev) =>
            prev.map((item) =>
                item.cartKey in prices && Number.isFinite(prices[item.cartKey])
                    ? { ...item, price: prices[item.cartKey] }
                    : item
            )
        );
    };

    const totalItems = useMemo(() => {
        return cart.reduce(
            (total, item) => total + item.quantity,
            0
        );
    }, [cart]);

    const totalPrice = useMemo(() => {
        return cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }, [cart]);

    const hasPublicSectorDiscount = useMemo(
        () => cart.some((item) => !!item.metadata?.publicSectorDiscount),
        [cart]
    );

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                addPlanToCart,
                addProductToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                updateLinePrices,
                totalItems,
                totalPrice,
                hydrated,
                hasPublicSectorDiscount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used within CartProvider"
        );
    }

    return context;
}