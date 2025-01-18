import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AIFlow", (m) => {
  const aiAgent = m.contract("AIFlowAgent");
  const msgSender = m.getAccount(0);
  const aiOracle = m.contract("AIFlowOracle", [aiAgent, msgSender]);
  m.call(aiAgent, "transferOwnership", [aiOracle]);

  return { aiAgent, aiOracle };
});
