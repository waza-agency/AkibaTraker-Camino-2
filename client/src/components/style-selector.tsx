import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { stylePresets } from "../lib/style-presets";
import { translations } from "@/lib/translations";

interface StyleSelectorProps {
  selected: string;
  onSelect: (style: string) => void;
}

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  // Función para obtener el nombre traducido del estilo
  const getStyleName = (style: string) => {
    return translations.styles[style as keyof typeof translations.styles]?.name || 
           style.charAt(0).toUpperCase() + style.slice(1);
  };

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
                {getStyleName(style)}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </Card>
      ))}
    </RadioGroup>
  );
}
