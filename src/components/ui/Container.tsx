import type { ElementType, ReactNode } from "react";

const WIDTH_CLASS = {
  default: "container",
  wide: "container-wide",
  text: "container-text",
  fluid: "container-fluid",
} as const;

export type ContainerWidth = keyof typeof WIDTH_CLASS;

type ContainerProps = {
  children: ReactNode;
  width?: ContainerWidth;
  as?: ElementType;
  className?: string;
};

export default function Container({
  children,
  width = "default",
  as: Tag = "div",
  className,
}: ContainerProps) {
  return (
    <Tag className={[WIDTH_CLASS[width], className].filter(Boolean).join(" ")}>{children}</Tag>
  );
}
