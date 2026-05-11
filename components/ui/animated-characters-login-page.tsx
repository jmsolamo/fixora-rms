"use client";

import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { EyeBall, Pupil } from "@/components/ui/animated-login-eyes";
import { ThemeToggle } from "@/components/theme-toggle";
import { saveAuthSession } from "@/lib/auth-session";

function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () =>
      setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () =>
      setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => setIsLookingAtEachOther(false), 800);
      return () => clearTimeout(timer);
    }
    setIsLookingAtEachOther(false);
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      let cancelled = false;
      let outerTimeout: ReturnType<typeof setTimeout>;
      let innerTimeout: ReturnType<typeof setTimeout>;

      const schedulePeek = () => {
        outerTimeout = setTimeout(() => {
          if (cancelled) return;
          setIsPurplePeeking(true);
          innerTimeout = setTimeout(() => {
            if (!cancelled) {
              setIsPurplePeeking(false);
              schedulePeek();
            }
          }, 800);
        }, Math.random() * 3000 + 2000);
      };

      schedulePeek();
      return () => {
        cancelled = true;
        clearTimeout(outerTimeout);
        clearTimeout(innerTimeout);
      };
    }
    setIsPurplePeeking(false);
  }, [password, showPassword]);

  const calculatePosition = (ref: RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data: unknown = await res.json();
      const message =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Unable to sign in.";

      if (!res.ok) {
        setError(message);
        return;
      }

      const payload = data as {
        ok?: boolean;
        userId?: number;
        role?: number;
        username?: string;
        displayName?: string;
      };

      if (
        payload.ok === true &&
        typeof payload.userId === "number" &&
        typeof payload.role === "number"
      ) {
        if (payload.role === 1) {
          saveAuthSession({
            userId: payload.userId,
            role: payload.role,
            username: payload.username ?? username.trim(),
            displayName: (payload.displayName ?? payload.username ?? username).trim(),
          });
          router.push("/admin");
          return;
        }
        setError(
          "Admin dashboard is only available for administrator accounts (role 1).",
        );
        return;
      }

      setSuccess("Signed in successfully.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground lg:flex">
        <div className="relative z-20">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-sm">
              <Sparkles className="size-4" />
            </div>
            <span>Fixora-RMS</span>
          </div>
        </div>

        <div className="relative z-20 flex h-[500px] items-end justify-center">
          <div className="relative" style={{ width: "550px", height: "400px" }}>
            <div
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "70px",
                width: "180px",
                height:
                  isTyping || (password.length > 0 && !showPassword)
                    ? "440px"
                    : "400px",
                backgroundColor: "#6C3FF5",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform:
                  password.length > 0 && showPassword
                    ? "skewX(0deg)"
                    : isTyping || (password.length > 0 && !showPassword)
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? "20px"
                      : isLookingAtEachOther
                        ? "55px"
                        : `${45 + purplePos.faceX}px`,
                  top:
                    password.length > 0 && showPassword
                      ? "35px"
                      : isLookingAtEachOther
                        ? "65px"
                        : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isPurpleBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                        ? 3
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                        ? 4
                        : undefined
                  }
                />
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isPurpleBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                        ? 3
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                        ? 4
                        : undefined
                  }
                />
              </div>
            </div>

            <div
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "240px",
                width: "120px",
                height: "310px",
                backgroundColor: "#2D2D2D",
                borderRadius: "8px 8px 0 0",
                zIndex: 2,
                transform:
                  password.length > 0 && showPassword
                    ? "skewX(0deg)"
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : isTyping || (password.length > 0 && !showPassword)
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? "10px"
                      : isLookingAtEachOther
                        ? "32px"
                        : `${26 + blackPos.faceX}px`,
                  top:
                    password.length > 0 && showPassword
                      ? "28px"
                      : isLookingAtEachOther
                        ? "12px"
                        : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? 0
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? -4
                        : undefined
                  }
                />
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? 0
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? -4
                        : undefined
                  }
                />
              </div>
            </div>

            <div
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "0px",
                width: "240px",
                height: "200px",
                zIndex: 3,
                backgroundColor: "#FF9B6B",
                borderRadius: "120px 120px 0 0",
                transform:
                  password.length > 0 && showPassword
                    ? "skewX(0deg)"
                    : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? "50px"
                      : `${82 + (orangePos.faceX || 0)}px`,
                  top:
                    password.length > 0 && showPassword
                      ? "85px"
                      : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={
                    password.length > 0 && showPassword ? -5 : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword ? -4 : undefined
                  }
                />
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={
                    password.length > 0 && showPassword ? -5 : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword ? -4 : undefined
                  }
                />
              </div>
            </div>

            <div
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "310px",
                width: "140px",
                height: "230px",
                backgroundColor: "#E8D754",
                borderRadius: "70px 70px 0 0",
                zIndex: 4,
                transform:
                  password.length > 0 && showPassword
                    ? "skewX(0deg)"
                    : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? "20px"
                      : `${52 + (yellowPos.faceX || 0)}px`,
                  top:
                    password.length > 0 && showPassword
                      ? "35px"
                      : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={
                    password.length > 0 && showPassword ? -5 : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword ? -4 : undefined
                  }
                />
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={
                    password.length > 0 && showPassword ? -5 : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword ? -4 : undefined
                  }
                />
              </div>
              <div
                className="absolute h-[4px] w-20 rounded-full bg-[#2D2D2D] transition-all duration-200 ease-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? "10px"
                      : `${40 + (yellowPos.faceX || 0)}px`,
                  top:
                    password.length > 0 && showPassword
                      ? "88px"
                      : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 py-2 text-sm text-primary-foreground/60" />

        <div className="pointer-events-none absolute inset-0 login-bg-grid" />
        <div className="absolute right-1/4 top-1/4 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 rounded-full bg-primary-foreground/5 blur-3xl" />
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-[420px]">
          <div
            className="relative rounded-xl border-2 border-border bg-card p-6 sm:p-8"
            style={{
              boxShadow:
                "0 0 0 2px var(--border), 0 0 0 6px var(--background), 0 0 0 8px color-mix(in oklch, var(--foreground) 14%, transparent), 0 20px 48px -12px color-mix(in oklch, var(--foreground) 26%, transparent), 0 6px 16px -4px color-mix(in oklch, var(--foreground) 14%, transparent)",
            }}
          >
            <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
              <ThemeToggle />
            </div>

            <div className="mb-8 flex items-center justify-center gap-2 pr-12 text-lg font-semibold lg:hidden">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="size-4 text-primary" />
              </div>
              <span>Fixora-RMS</span>
            </div>

            <div className="mb-8 text-center sm:mb-10 lg:pr-10">
              <h1 className="mb-2 text-3xl font-bold tracking-tight">
                Welcome back!
              </h1>
              <p className="text-sm text-muted-foreground">
                Please enter your details
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  autoComplete="username"
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className="h-12 rounded-md border-2 border-foreground/20 bg-background shadow-sm ring-1 ring-black/[0.04] transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-foreground/35 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:ring-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-md border-2 border-foreground/20 bg-background pr-10 shadow-sm ring-1 ring-black/[0.04] transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:shadow-md focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-foreground/35 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm font-normal"
                >
                  Remember for 30 days
                </Label>
              </div>

              {error && (
                <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3 text-sm text-emerald-400">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="h-12 w-full text-base font-medium"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Log in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Component = LoginPage;
