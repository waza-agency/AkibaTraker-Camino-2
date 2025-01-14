import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const MUSIC_OPTIONS = [
  { id: "epic", name: "Epic Orchestra", file: "epic.mp3" },
  { id: "lofi", name: "Lo-fi Beats", file: "lofi.mp3" },
  { id: "jpop", name: "J-Pop", file: "jpop.mp3" },
  { id: "rock", name: "Rock", file: "rock.mp3" },
];

interface MusicSelectorProps {
  selected: string;
  onSelect: (file: string) => void;
}

export default function MusicSelector({ selected, onSelect }: MusicSelectorProps) {
  return (
    <RadioGroup
      value={selected}
      onValueChange={onSelect}
      className="grid gap-4"
    >
      {MUSIC_OPTIONS.map((option) => (
        <div
          key={option.id}
          className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent"
        >
          <RadioGroupItem value={option.file} id={option.id} />
          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
            {option.name}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}
