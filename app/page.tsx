import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black font-sans p-6">

      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter mb-2">Mentoria High Ticket</h1>
          <p className="text-gray-600">Acesse sua área exclusiva.</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="group relative flex w-full justify-center rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Entrar na Plataforma
            <ArrowRightIcon className="ml-2 h-5 w-5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="pt-12 text-xs text-gray-400">
          <p>&copy; 2024 - Todos os direitos reservados.</p>
        </div>
      </div>

    </div>
  );
}
