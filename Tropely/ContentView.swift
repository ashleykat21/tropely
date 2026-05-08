
import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        return WKWebView()
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.load(URLRequest(url: url))
    }
}

struct ContentView: View {
    var body: some View {
        WebView(url: URL(string: "https://tropely-app-live.netlify.app")!)
            .ignoresSafeArea()
    }
}
