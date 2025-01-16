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

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useUser();
  const { toast } = useToast();
  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      const result = isLogin ? await login(data) : await register(data);

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: isLogin ? "Welcome back!" : "Account created successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
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
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h2>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="pixel-borders"
                          autoComplete="username"
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
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          className="pixel-borders"
                          autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full retro-btn">
                  {isLogin ? "Login" : "Create Account"}
                </Button>

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isLogin
                      ? "Need an account? Sign up"
                      : "Already have an account? Login"}
                  </button>
                </div>
              </form>
            </Form>
          </motion.div>
        </Card>
      </div>
    </div>
  );
}