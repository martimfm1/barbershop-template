"use client";
//utils
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type BookingFormProps} from "@/types";

//UI
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";


export function BookingForm({
  clients,
  services,
  professionals,
  loading,
  formData,
  setFormData,
  selectedProfessionalId,
  setSelectedProfessionalId,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  onSubmit,
}: BookingFormProps) {
  return (
    <Card className="border border-emerald-500/20 bg-black/40 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
      <CardHeader>
        <CardTitle className="text-emerald-400 flex gap-2">
          <Plus className="size-5" /> New Booking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end"
        >
          {/* Quick Select */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">
              Quick Select (Optional)
            </label>
            <Combobox
              value={formData.clientId || ""}
              onValueChange={(val) => {
                const cl = clients.find((c) => c.id === val);
                if (cl)
                  setFormData({
                    ...formData,
                    clientId: cl.id,
                    name_complete: cl.name_complete,
                    num_phone: cl.num_phone,
                    email: cl.email || "",
                  });
              }}
            >
              <ComboboxInput
                placeholder="Search client..."
                className="bg-zinc-900 border-white/10 text-white"
              />
              <ComboboxContent className="bg-zinc-900 border-white/10 text-white">
                <ComboboxList>
                  <ComboboxEmpty>No clients found.</ComboboxEmpty>
                  {clients.map((c) => (
                    <ComboboxItem key={c.id} value={c.id}>
                      {c.name_complete}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Client Name */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Client Name</label>
            <input
              required
              placeholder="Enter name"
              className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white"
              value={formData.name_complete}
              onChange={(e) =>
                setFormData({ ...formData, clientId: "", name_complete: e.target.value })
              }
            />
          </div>

          {/* Phone */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Phone</label>
            <input
              required
              placeholder="Enter phone number"
              type="tel"
              className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white"
              value={formData.num_phone}
              onChange={(e) =>
                setFormData({ ...formData, clientId: "", num_phone: e.target.value })
              }
            />
          </div>

          {/* Barber */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Barber</label>
            <Select
              value={selectedProfessionalId}
              onValueChange={setSelectedProfessionalId}
            >
              <SelectTrigger className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectGroup>
                  {professionals.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Service */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Service</label>
            <Select
              value={formData.service_id}
              onValueChange={(val) =>
                setFormData({ ...formData, service_id: val })
              }
            >
              <SelectTrigger className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white cursor-pointer">
                <SelectGroup>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({Number(s.price).toFixed(2)}€)
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "justify-start bg-white/5 border border-white/10 text-white hover:bg-white/10 cursor-pointer",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {selectedDate
                    ? format(new Date(selectedDate + "T00:00:00"), "PPP")
                    : "Choose date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 cursor-pointer">
                <Calendar
                  mode="single"
                  selected={
                    selectedDate
                      ? new Date(selectedDate + "T00:00:00")
                      : undefined
                  }
                  onSelect={(d) =>
                    d && setSelectedDate(format(d, "yyyy-MM-dd"))
                  }
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid gap-2">
            <label className="text-xs text-zinc-400">Time</label>
            <input
              type="time"
              required
              className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white color-scheme-dark cursor-pointer"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            variant="ghost"
            className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 w-full cursor-pointer"
          >
            {loading ? <Spinner className="mr-2" /> : "Save Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}