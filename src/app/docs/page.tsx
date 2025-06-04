import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Documentation - NVRS",
  description: "Documentation for NVRS - NIP-05 Verification Service",
};

export default function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />
      {/* Main Content */}
      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Documentation</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Learn how to use NVRS - NIP-05 Verification Service
              </p>
            </div>

            <Tabs defaultValue="getting-started" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
                <TabsTrigger value="getting-started" className="text-xs md:text-sm py-2">Getting Started</TabsTrigger>
                <TabsTrigger value="nip05" className="text-xs md:text-sm py-2">NIP-05 Verification</TabsTrigger>
                <TabsTrigger value="notifications" className="text-xs md:text-sm py-2">Notifications</TabsTrigger>
                <TabsTrigger value="security" className="text-xs md:text-sm py-2">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="getting-started">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Getting Started</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Learn the basics of using NVRS
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">What is NVRS?</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        NVRS is a free NIP-05 verification service that allows Nostr users to verify their identity
                        using their public key. This helps establish trust and authenticity in the Nostr network.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Features</h3>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Free NIP-05 verification</li>
                        <li>Real-time notifications</li>
                        <li>Secure session management</li>
                        <li>User-friendly dashboard</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Getting Started</h3>
                      <ol className="list-decimal list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Create an account or login with your Nostr key</li>
                        <li>Navigate to the dashboard</li>
                        <li>Request a NIP-05 verification</li>
                        <li>Wait for verification confirmation</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="nip05">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">NIP-05 Verification</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Learn about NIP-05 verification process
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">What is NIP-05?</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        NIP-05 is a Nostr Improvement Proposal that defines a way to verify a user's identity
                        by linking their public key to a domain name. This helps establish trust and authenticity
                        in the Nostr network.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Verification Process</h3>
                      <ol className="list-decimal list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Submit your public key and desired username</li>
                        <li>Wait for the verification process to complete</li>
                        <li>Once verified, your NIP-05 identifier will be active</li>
                        <li>You can use this identifier in your Nostr client</li>
                      </ol>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Rate Limits</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        To ensure fair usage, we implement the following rate limits:
                      </p>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Maximum 10 NIP-05 requests per hour</li>
                        <li>One active NIP-05 identifier per user</li>
                        <li>Username must be unique across the service</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Notifications</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Learn about the notification system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Notification Types</h3>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Profile updates</li>
                        <li>NIP-05 verification status</li>
                        <li>Security alerts</li>
                        <li>System announcements</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Managing Notifications</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        You can manage your notifications through the notification bell in the navigation bar:
                      </p>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>View all notifications</li>
                        <li>Mark notifications as read</li>
                        <li>Clear all notifications</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Security</CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Learn about security features and best practices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Security Features</h3>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Session management with expiry</li>
                        <li>Rate limiting for API requests</li>
                        <li>Secure storage of public keys</li>
                        <li>Protection against session hijacking</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Best Practices</h3>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>Always log out when using shared devices</li>
                        <li>Keep your private key secure</li>
                        <li>Regularly check your notification center</li>
                        <li>Report any suspicious activity</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base md:text-lg font-semibold">Session Management</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Sessions are managed with the following features:
                      </p>
                      <ul className="list-disc list-inside space-y-1 md:space-y-2 text-sm md:text-base text-muted-foreground">
                        <li>30-minute session timeout</li>
                        <li>Single active session per user</li>
                        <li>Automatic logout on inactivity</li>
                        <li>Session ID verification</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
} 