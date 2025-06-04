import { Metadata } from "next"
import Navbar from "@/components/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "About NVRS NIP-05",
  description: "Learn about our free NIP-05 verification service for Nostr addresses",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">About NVRS NIP-05</h1>
        
        <Alert className="mb-8">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>What is NIP-05?</AlertTitle>
          <AlertDescription>
            NIP-05 is a Nostr Improvement Proposal that enables verification of Nostr public keys through domain names. 
            It allows users to create human-readable identifiers for their Nostr accounts, similar to how email addresses work.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Service</CardTitle>
              <CardDescription>NVRS provides a free NIP-05 verification service</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Create a verified Nostr identity</li>
                <li>Get a human-readable identifier</li>
                <li>Enhance your credibility in the Nostr ecosystem</li>
                <li>Make your account more recognizable and trustworthy</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Simple steps to get your NIP-05 verification</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Sign up for a free account</li>
                <li>Choose your desired username</li>
                <li>Verify your Nostr public key</li>
                <li>Start using your new NIP-05 identifier</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Trust</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">Verified identities help build trust in the Nostr community</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Easy to Remember</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">Human-readable addresses are easier to share and remember</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Free Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">No cost to get your NIP-05 verification</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Simple Process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">Quick and easy verification process</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Ready to Get Started?</CardTitle>
            <CardDescription>Join our community and get your free NIP-05 verification today!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/login">Get Started</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 