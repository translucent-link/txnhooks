export class Config {

  webhookURL: string;
  abis: ABI[];
  allContracts: ChainContracts[];
  chains: Chain[];

  constructor({webhookURL, abis, allContracts, chains}: any) {
    this.abis = abis;
    this.allContracts = allContracts;
    this.chains = chains;
    this.webhookURL = webhookURL;
  }

  findABIByType(type: string): ABI | undefined {
    return this.abis.find(abi => abi.type === type);
  }

  findChainById(id: number): Chain | undefined {
    return this.chains.find(chain => chain.network.chainId === id);
  }
}

export class ABI {
  constructor(public type: string, public definition: any) {}
}

class ChainContracts {
  constructor(public chainId: number, public contracts: ContractDefinition[]) {}
}

class ContractDefinition {
  constructor(public address: string, public type: string, public name: string) {}
}

class Network {
  constructor(public name: string, public chainId: number) {}
}

class Chain {
  constructor(public network: Network, public rpcWS: string, public rpcHTTPS: string) {}
}
