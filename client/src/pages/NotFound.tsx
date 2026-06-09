import { Link } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Layout>
      <div className="container-wide grid min-h-[60vh] place-items-center py-20 text-center">
        <div>
          <p className="mb-3 text-sm font-semibold text-teal-700">404</p>
          <h1 className="mb-4 font-serif text-4xl text-ink-950">Page not found</h1>
          <p className="mb-8 max-w-md text-ink-500">The page may have moved while the hub was being prepared.</p>
          <Link href="/">
            <Button className="bg-teal-700 text-white hover:bg-teal-800">Back to home</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
