import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { sendMessage } from "@/app/redux/slices/chatMessagesSlice"
import { useToast } from "@/hooks/use-toast"
import { useAppDispatch } from "@/app/redux/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendHorizontal, Loader2 } from "lucide-react"
import { useState } from "react"

interface MessageFormData {
  message: string
}

interface MessageInputProps {
  roomId: string
  onMessageSent: () => void
}

const MessageInput = ({ roomId, onMessageSent }: MessageInputProps) => {
  const form = useForm<MessageFormData>({
    defaultValues: { message: "" },
  });
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  const onSubmit = async (data: MessageFormData) => {
    if (data.message.trim()) {
      setIsSending(true);
      try {
        await dispatch(sendMessage({ content: data.message, roomId })).unwrap();
        form.reset();
        onMessageSent()
      } catch (error) {
        console.error("Failed to send message:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="border-t p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    placeholder="Type a message..."
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(onSubmit)();
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="icon">
            {isSending ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default MessageInput