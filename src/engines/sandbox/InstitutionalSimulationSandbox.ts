import { AXPTDigitalTwinEngine } from '../twin/AXPTDigitalTwinEngine'

export class InstitutionalSimulationSandbox {
  constructor(private twin: AXPTDigitalTwinEngine) {}

  /**
   * 🧪 RUN FULL ECONOMIC SIMULATION
   */
  async simulateScenario(input: any) {
    const result = await this.twin.simulate(input)

    return {
      outcome: result.recommendation,
      risk: result.riskScore,
      stress: result.riskScore,
      recommendation: result.recommendation,
    }
  }
}
