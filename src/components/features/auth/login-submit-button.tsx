import { ArrowRight, Loader2 } from "lucide-react";

interface LoginSubmitButtonProps {
  loading: boolean;
}

export function LoginSubmitButton({ loading }: LoginSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold tracking-widest text-lg md:text-xl uppercase transition-all group disabled:opacity-70 flex items-center justify-center"
      aria-label={loading ? "Sedang memproses masuk" : "Masukkan akun untuk login"}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : (
        <span className="inline-flex items-center gap-2.5">
          MASUK
          <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
        </span>
      )}
    </button>
  );
}
