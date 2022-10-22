import { ethers } from "ethers";
import YAML from 'yaml'
import { promises as fsPromises } from 'fs';
import { Config, ABI } from './config';
import logger from "./logger";

const loadConfig = async (configFilePath: string): Promise<Config> => {
  const configYaml = await fsPromises.readFile(configFilePath, 'utf8');
  return YAML.parse(configYaml).config; 
}

const contractEventsFromABI = (abi: ABI): string[] => {
  const events: string[] = [];

  for (const line of abi.definition) {
    const match = line.match(/event\s+(\w+)/);
    if (match) {
      events.push(match[1]);
    }
  }
  return events;
}

const callWebhook = async (url: string, data: any) => fetch(url, {method: 'POST', body: JSON.stringify(data), headers: {'Content-Type': 'application/json'}})


const run = async () => {

  try {
    const configFilePath = process.env.CONFIG_FILE_PATH || './config.yaml';
    logger.info(`Loading config from ${configFilePath}`);
    const config = new Config(await loadConfig(configFilePath));
    logger.info('Config loaded');
    logger.info('Notfications will be sent to ' + config.webhookURL);


    for (const contractsOnChain of config.allContracts) {
      const chain = config.findChainById(contractsOnChain.chainId);
      if (chain) {
        logger.info(`Processing Chain: ${chain.network.name}`)
        const provider = new ethers.providers.JsonRpcProvider( chain.rpcHTTPS, chain.network )
        for (const contractDefn of contractsOnChain.contracts) {
          logger.info(`Processing Contract: ${contractDefn.name}`)

          const abi = config.findABIByType(contractDefn.type);
          if (abi) {
            const contract = new ethers.Contract(contractDefn.address, abi.definition, provider);
                  
            const eventNames = contractEventsFromABI(abi);
            for (const eventName of eventNames) {
              logger.info(`Registering interest in ${eventName}`)
              contract.on(eventName, (...args: any) => {

                const event = args[args.length - 1];
                const params = args.slice(0, args.length - 1);

                const data = {
                  contractDefn, eventName, params, event: {
                    blockNumber: event.blockNumber,
                    blockHash: event.blockHash,
                    transactionHash: event.transactionHash,
                    logIndex: event.logIndex,
                    transactionIndex: event.transactionIndex,
                    removed: event.removed,
                    address: event.address,
                    data: event.data,
                    event: event.event,
                    eventSignature: event.eventSignature,
                    args: event.args
                  }, chain: {
                    chainId: chain.network.chainId,
                    network: chain.network.name
                  }
                }

                logger.info(`Sending notification for ${eventName} on ${contractDefn.name} on ${chain.network.name} during txn ${event.transactionHash}`)
                callWebhook(config.webhookURL, data)
  
              })
            }
          }
        }
  
      } else {
        console.log(`No chain found for ${contractsOnChain.chainId}`)
      }


    }
    
  } catch (error) {
    console.error(error)
  }
}
run()

