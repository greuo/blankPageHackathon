import { Component, type ReactNode } from 'react';
import { HeartPulse } from 'lucide-react';
import { errorText } from './components/ui';
import { patientStore } from './patient/store';
import PatientApp from './patient/PatientApp';
import AuthGate from './auth/AuthGate';
import { signOut } from './data/supabase';
import { InteractionFeedback } from './components/InteractionFeedback';
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean; resetError: string }
> {
  state = { error: false, resetError: '' };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal-error">
        <HeartPulse />
        <h1>We couldn’t open your companion</h1>
        <p>
          Your browser may have unavailable or invalid demo storage. Reload to try again; do not
          enter real patient information.
        </p>
        <button className="btn primary" onClick={() => location.reload()}>
          Reload companion
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            try {
              patientStore.reset();
              this.setState({ error: false, resetError: '' });
            } catch (reason) {
              this.setState({ resetError: errorText(reason) });
            }
          }}
        >
          Reset fictional demo
        </button>
        <p>Reset restores sample records and removes local demo edits.</p>
        {this.state.resetError && (
          <p className="alert error" role="alert">
            {this.state.resetError}
          </p>
        )}
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <InteractionFeedback>
        <AuthGate>{(user) => <PatientApp user={user} onSignOut={signOut} />}</AuthGate>
      </InteractionFeedback>
    </ErrorBoundary>
  );
}
