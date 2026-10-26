import { Image, type ImageStyle } from "react-native";
const icons = {
  home: require("../../assets/brand/home.png"),
  payroll: require("../../assets/brand/payroll.png"),
  requests: require("../../assets/brand/requests.png"),
  people: require("../../assets/brand/people.png"),
  account: require("../../assets/brand/account.png"),
};
export type IconName = keyof typeof icons;
export function AppIcon({
  name,
  color,
  size = 24,
}: {
  name: IconName;
  color: ImageStyle["tintColor"];
  size?: number;
}) {
  return (
    <Image
      source={icons[name]}
      style={{ width: size, height: size, tintColor: color }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
export function BrandMark() {
  return (
    <Image
      source={require("../../assets/brand/icon.png")}
      style={{ width: 30, height: 30, borderRadius: 8 }}
      accessible={false}
    />
  );
}
