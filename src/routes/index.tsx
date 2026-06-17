import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";
import {
  Car,
  Timer,
  MapPin,
  CreditCard,
  Star,
  Shield,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
              Live Session Tracking Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Vehicle Hire &{" "}
              <span className="bg-gradient-to-r from-accent-300 to-accent-100 bg-clip-text text-transparent">
                Session Tracking
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
              A real-time platform connecting car hire agents with clients.
              Live session monitoring, transparent billing, GPS fleet tracking,
              and seamless mobile payments — all in one place.
            </p>

            <div className="flex flex-wrap gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-white text-primary-700 hover:bg-white/90 shadow-xl">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="bg-white text-primary-700 hover:bg-white/90 shadow-xl">
                      Get Started Free
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
              Everything You Need to Manage Vehicle Hire
            </h2>
            <p className="text-lg text-surface-500 max-w-2xl mx-auto">
              From listing vehicles to live session monitoring and automated billing,
              we handle it all.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Timer className="w-6 h-6" />,
                title: "Real-Time Session Tracking",
                desc: "Live elapsed timer and running charge counter visible to both agent and client during active hire sessions.",
                color: "from-primary-500 to-primary-600",
              },
              {
                icon: <MapPin className="w-6 h-6" />,
                title: "GPS Fleet Visibility",
                desc: "Track approximate vehicle locations in real-time from the client's mobile device. Full fleet map view for agents.",
                color: "from-success-500 to-success-600",
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "Seamless Payments",
                desc: "Integrated Paystack payments supporting M-Pesa, Airtel Money, and card payments with automated invoicing.",
                color: "from-accent-500 to-accent-600",
              },
              {
                icon: <Car className="w-6 h-6" />,
                title: "Vehicle Management",
                desc: "Agents list vehicles with photos, descriptions, and custom hire rates. Clients browse and book instantly.",
                color: "from-warning-500 to-warning-600",
              },
              {
                icon: <Star className="w-6 h-6" />,
                title: "Reviews & Ratings",
                desc: "Clients rate completed sessions. Ratings appear on vehicle listings, building trust and accountability.",
                color: "from-danger-500 to-danger-600",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Admin Oversight",
                desc: "Administrators approve agents, monitor all sessions platform-wide, and access comprehensive analytics.",
                color: "from-surface-600 to-surface-700",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-surface-100 hover:border-surface-200 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-surface-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Agent Lists Vehicle", desc: "Approved agents add vehicles with hire rates per hour or day." },
              { step: "02", title: "Client Books", desc: "Client browses listings and places a hire order. Vehicle is reserved." },
              { step: "03", title: "Live Session", desc: "On pickup, the timer starts. Live charge & GPS tracking throughout." },
              { step: "04", title: "Pay & Review", desc: "On return, pay via M-Pesa or card. Leave a rating for the agent." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-surface-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Modernize Your Fleet?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Join as an agent to start listing vehicles, or sign up as a client to hire today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-white/90 shadow-xl">
                <CheckCircle className="w-5 h-5" />
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-surface-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-primary-400" />
              <span className="font-semibold text-white">VehicleHire</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} Vehicle Hire & Session Tracking System.
              INSY 492 Senior Project — Gerison Kimathi Muriungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
