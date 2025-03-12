import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

type AuthFormData = {
  username: string;
  password: string;
  email?: string;
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useUser();
  const { toast } = useToast();

  const authSchema = z.object({
    username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    email: isLogin ? z.string().optional() : z.string().email("Por favor, ingrese una dirección de correo electrónico válida"),
  });

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [tokenParam] = useState(new URLSearchParams(window.location.search).get('token'));
  const [newPassword, setNewPassword] = useState("");

  // Reset form when switching between login and register
  React.useEffect(() => {
    form.reset({
      username: "",
      password: "",
      email: "",
    });
  }, [isLogin, form]);

  const onSubmit = async (data: AuthFormData) => {
    try {
      const result = isLogin 
        ? await login({ username: data.username, password: data.password })
        : await register(data);

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "¡Éxito!",
        description: isLogin ? "¡Bienvenido de nuevo!" : "¡Cuenta creada exitosamente!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Algo salió mal",
        variant: "destructive",
      });
    }
  };

  const handlePasswordResetRequest = async () => {
    const response = await fetch('/api/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resetEmail })
    });
    
    if (response.ok) {
      alert('Check your email for reset instructions');
    } else {
      alert('Error sending reset request');
    }
  };

  const handlePasswordReset = async () => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenParam, newPassword })
    });
    
    if (response.ok) {
      alert('Password reset successfully');
      setShowReset(false);
    } else {
      alert('Error resetting password');
    }
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: 'url("https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeicz4mfqquhx7fgjbg6zuz35olhlfcxugbj4rmjpwkvulhixq3lwwa")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Hero Banner */}
        <div className="w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <img 
              src="https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeihuyqjzv4elqd4ypj5kakapnjdy54nqdodbqqijbxjogwxzktegxu"
              alt="Akiba AMV Hero"
              className="w-full h-auto rounded-lg shadow-2xl pixel-borders"
              style={{ 
                maxHeight: '300px',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end justify-center pb-6">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-2 glow-text">Akiba AMV</h1>
                <p className="text-muted-foreground">Crea increíbles videos musicales de anime con IA</p>
              </div>
            </div>
          </motion.div>
        </div>

        <Card className="w-full max-w-md p-6 retro-container bg-background/95 backdrop-blur-sm mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6 glow-text">
              {isLogin ? "¡Bienvenido de nuevo!" : "Crear Cuenta"}
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="pixel-borders"
                          autoComplete="username"
                          placeholder="Tu nombre de usuario"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          className="pixel-borders"
                          autoComplete={isLogin ? "current-password" : "new-password"}
                          placeholder="Tu contraseña"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            className="pixel-borders"
                            placeholder="Tu correo electrónico"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full retro-btn">
                  {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                </Button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isLogin
                      ? "¿No tienes cuenta? Regístrate"
                      : "¿Ya tienes cuenta? Inicia sesión"}
                  </button>
                </div>
              </form>
            </Form>

            <div className="reset-section">
              <button onClick={() => setShowReset(!showReset)}>
                Forgot Password?
              </button>

              {showReset && (
                <div className="reset-form">
                  {tokenParam ? (
                    <>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                      />
                      <input type="hidden" value={tokenParam} />
                    </>
                  ) : (
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  )}
                  <button onClick={handlePasswordResetRequest}>
                    Send Reset Link
                  </button>

                  <button onClick={handlePasswordReset}>
                    Reset Password
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </Card>
      </div>
    </div>
  );
}