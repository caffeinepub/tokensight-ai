import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080B14] flex items-center justify-center text-white">
          <div className="text-center p-8">
            <p className="text-[#D4AF37] font-mono font-bold text-lg mb-2">
              TokenSight AI
            </p>
            <p className="text-gray-400 font-mono text-sm">Loading...</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
