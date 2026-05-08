import React, { ReactNode } from "react";
import { ScrollView, ScrollViewProps } from "react-native";

type Props = ScrollViewProps & { children?: ReactNode };

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
