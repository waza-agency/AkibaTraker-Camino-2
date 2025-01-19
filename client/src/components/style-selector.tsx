import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface StylePreset {
  name: string;
  description: string;
}

const stylePresets: Record<string, StylePreset> = {
  "anime": {
    name: "Anime",
    description: "Stylized anime-inspired visuals with vibrant colors and smooth lines"
  },
  "realistic": {
    name: "Realistic",
    description: "Photo-realistic style with natural lighting and textures"
  },
  "watercolor": {
    name: "Watercolor",
    description: "Soft, artistic style with watercolor painting effects"
  },
  "pixel": {
    name: "Pixel Art",
    description: "Retro-inspired pixel art style with distinct blocks and limited color palette"
  }
};

interface StyleSelectorProps {
  selected: string;
  onSelect: (style: string) => void;
}

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <RadioGroup
      value={selected}
      onValueChange={onSelect}
      className="grid gap-4 mt-4"
    >
      {Object.entries(stylePresets).map(([style, preset]) => (
        <Card
          key={style}
          className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
            selected === style ? "border-primary" : ""
          }`}
          onClick={() => onSelect(style)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value={style} id={style} />
            <div className="flex-1">
              <Label htmlFor={style} className="font-medium">
                {preset.name}
              </Label>
              <p className="text-sm text-muted-foreground">{preset.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </RadioGroup>
  );
}