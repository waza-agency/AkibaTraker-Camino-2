import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSPViolation {
  blockedUri: string;
  documentUri: string;
  violatedDirective: string;
  originalPolicy: string;
  timestamp: string;
}

export function CSPTroubleshootWizard() {
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { toast } = useToast();

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/csp/violations");
      if (!response.ok) {
        throw new Error("Error al obtener las violaciones de CSP");
      }
      const data = await response.json();
      setViolations(data);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las violaciones de CSP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, []);

  const getViolationSeverity = (directive: string): "high" | "medium" | "low" => {
    if (directive.includes("script-src")) return "high";
    if (directive.includes("connect-src")) return "medium";
    return "low";
  };

  const getSolutionSteps = (violation: CSPViolation) => {
    const steps = [];
    
    if (violation.violatedDirective.includes("script-src")) {
      steps.push("Revisar scripts externos bloqueados");
      steps.push("Verificar uso de eval() o inline scripts");
      steps.push("Considerar agregar el dominio a la whitelist si es confiable");
    } else if (violation.violatedDirective.includes("connect-src")) {
      steps.push("Verificar conexiones a APIs externas");
      steps.push("Revisar WebSocket connections");
      steps.push("Asegurar que los dominios de API estén en la whitelist");
    }
    
    return steps;
  };

  const renderViolationCard = (violation: CSPViolation) => {
    const severity = getViolationSeverity(violation.violatedDirective);
    const steps = getSolutionSteps(violation);

    return (
      <Card key={violation.timestamp} className="p-4 mb-4">
        <div className="flex items-start gap-4">
          {severity === "high" && <AlertCircle className="w-6 h-6 text-red-500" />}
          {severity === "medium" && <AlertCircle className="w-6 h-6 text-yellow-500" />}
          {severity === "low" && <AlertCircle className="w-6 h-6 text-blue-500" />}
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              Violación de {violation.violatedDirective}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              URI Bloqueada: {violation.blockedUri}
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Pasos para resolver:</h4>
              <ul className="list-disc list-inside space-y-1">
                {steps.map((step, index) => (
                  <li key={index} className="text-sm">{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Asistente de Resolución CSP</h2>
        <Button
          onClick={fetchViolations}
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      {violations.length === 0 ? (
        <Card className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No se encontraron violaciones de CSP
          </h3>
          <p className="text-sm text-muted-foreground">
            Tu sitio está cumpliendo correctamente con las políticas de seguridad actuales.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {violations.map(renderViolationCard)}
        </div>
      )}
    </div>
  );
}
