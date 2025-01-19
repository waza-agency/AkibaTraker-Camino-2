import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { stylePresets } from "@db/schema";

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
      {Object.entries(stylePresets).map(([style, description]) => (
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
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </Card>
      ))}
    </RadioGroup>
  );
}
