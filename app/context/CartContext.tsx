"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from "react";

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


interface CartContextType {
    cart: CartItem[];

    addToCart: (item: CartItem) => void;

    addPlanToCart: (plan: any, simType?: "esim" | "psim") => void;

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

    totalItems: number;

    totalPrice: number;

    /** True once the cart has been loaded from localStorage on the client. */
    hydrated: boolean;
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

    const addPlanToCart = (plan: any, simType: "esim" | "psim" = "psim") => {
        const cartItem: CartItem = {
            cartKey: `plan-${plan.id}-${plan.duration_days}-${simType}`,

            id: plan.id,

            type: "plan",

            name: plan.name,

            slug: plan.slug,

            image: plan.og_image ?? "",

            category: plan.category?.name,

            price: Number(plan.final_price ?? plan.price),

            quantity: 1,

            metadata: {
                simType: simType,
                duration: plan.duration_days,
                dataAllowance: plan.data_allowance,
                transatelID: plan.transatelID,
                tier: plan.tier_label,
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
                totalItems,
                totalPrice,
                hydrated,
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