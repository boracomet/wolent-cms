import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };

type State = { hasError: boolean; message: string };

export class RouterErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message || "Beklenmeyen hata" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("RouterErrorBoundary:", err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-zinc-950 p-8 text-center">
          <p className="text-lg font-medium text-zinc-100">Bir şeyler ters gitti</p>
          <p className="max-w-md text-sm text-zinc-500">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
          >
            Ana sayfaya dön
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
