"use client";

// utils
import { ManualMessageFormProps } from "@/_types";

// UI
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ManualMessageForm({
  clients,
  reminderClientId,
  setReminderClientId,
  selectedTemplate,
  setSelectedTemplate,
  manualMessage,
  setManualMessage,
  applyMessageTemplate,
  onSubmit,
  sendingMessage = false,
}: ManualMessageFormProps) {
  return (
    <Card className="border border-green-500/20 bg-black/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
      <CardHeader>
        <CardTitle className="text-green-400 flex gap-2">
          <MessageCircle className="size-5" /> Send Message / Manual Reminder
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Send real-time alerts through your connected bot infrastructure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3 items-end">
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Select Client</label>
            <Select
              value={reminderClientId}
              onValueChange={(val) => {
                setReminderClientId(val);
                applyMessageTemplate(val, selectedTemplate);
              }}
            >
              <SelectTrigger className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectGroup>
                  <SelectItem value="manual">Enter phone number</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name_complete}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Preset Template</label>
            <Select
              value={selectedTemplate}
              onValueChange={(val) => {
                setSelectedTemplate(val);
                applyMessageTemplate(reminderClientId, val);
              }}
            >
              <SelectTrigger className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectGroup>
                  <SelectItem value="custom">Custom Message (Blank)</SelectItem>
                  <SelectItem value="reminder_tomorrow">Booking Reminder (Tomorrow)</SelectItem>
                  <SelectItem value="miss_you">Reactivation Message</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Mobile Number</label>
            <input
              required
              type="tel"
              placeholder="Enter phone number"
              className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white"
              value={manualMessage.phone}
              onChange={(e) =>
                setManualMessage({
                  ...manualMessage,
                  phone: e.target.value,
                })
              }
              disabled={reminderClientId !== "manual"}
            />
          </div>

          <div className="grid gap-2 md:col-span-3">
            <label className="text-xs text-zinc-400">Message Body</label>
            <textarea
              required
              rows={3}
              placeholder="Enter message"
              className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white resize-none"
              value={manualMessage.text}
              onChange={(e) =>
                setManualMessage({
                  ...manualMessage,
                  text: e.target.value,
                })
              }
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <Button
              type="submit"
              disabled={sendingMessage || !manualMessage.text || !manualMessage.phone}
              variant="ghost"
              className="bg-green-600 hover:bg-green-500 text-white px-6 cursor-pointer"
            >
              {sendingMessage ? <Spinner className="mr-2" /> : <MessageCircle className="mr-2 size-4" />} Send message
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}