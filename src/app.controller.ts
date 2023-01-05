import { Controller, Get } from '@nestjs/common';
import { Abi, Contract, Provider,number,uint256 } from 'starknet';
import { CONTRACT_ADDRESS } from './indexing/utils';
import testpillAbi from "./abi/testpill.json";
@Controller()
export class AppController {
  private provider:Provider;
  private contract:Contract;
  @Get('/health')
  getHealth(): string {
    return 'OK';
  }
  @Get('darren')
  async test(): Promise<string> {
    this.provider = new Provider({sequencer: {
      network: 'goerli-alpha' 
    }});
    this.contract = new Contract(testpillAbi as Abi,CONTRACT_ADDRESS,this.provider);
    console.log("darren test");
    const NameOfContract = await this.contract.call('tokenURI', [uint256.bnToUint256(number.toBN(1))]);
    const resultArray =  NameOfContract.map((data) => number.bigNumberishArrayToHexadecimalStringArray(data));
    
    const jsonStringArray = resultArray[0].map((json) => this.hex2a(json)).join('');
    return jsonStringArray;
  }

  hex2a(hexx: string) {
    var hex = hexx.toString(); //force conversion
    var str = "";
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)).replace("\x00","");
    str = str.replace("data:application/json,",'');  
    return str;
}
}
