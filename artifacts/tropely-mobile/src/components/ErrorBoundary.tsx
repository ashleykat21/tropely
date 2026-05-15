import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>We're sorry — an unexpected error occurred.</Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Try again</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <ScrollView style={styles.devBox}>
              <Text style={styles.devText}>{this.state.error.toString()}</Text>
            </ScrollView>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaf9", alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emoji: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  sub: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  btn: { backgroundColor: "#1a1a1a", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  devBox: { marginTop: 16, backgroundColor: "#fee2e2", borderRadius: 8, padding: 12, maxHeight: 200, width: "100%" },
  devText: { fontSize: 11, color: "#991b1b", fontFamily: "monospace" },
});
