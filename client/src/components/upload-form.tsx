import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Image } from "lucide-react";

interface UploadFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export default function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const form = useForm({
    defaultValues: {
      prompt: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data.prompt))}>
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt or Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your AMV scene or paste an image URL..."
                  className="h-32 resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full mt-4"
          disabled={isLoading}
        >
          <Image className="mr-2 h-4 w-4" />
          {isLoading ? "Generating..." : "Generate AMV"}
        </Button>
      </form>
    </Form>
  );
}
