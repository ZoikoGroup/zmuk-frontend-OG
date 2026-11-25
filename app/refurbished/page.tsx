import DevicesList from "../devices/Deviceslist";

export const metadata = {
  title: "Refurbished Smartphones | Zoiko Mobile UK",
  description: "Premium refurbished phones, graded A1 and A2, with a flexible Zoiko SIM plan.",
};

export default function Page() {
  return <DevicesList variant="refurbished" />;
}
