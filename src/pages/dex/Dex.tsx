import { ethers } from 'ethers';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { FaAngleDown } from 'react-icons/fa';
import { MdOutlineInfo, MdOutlineSwapVert } from 'react-icons/md';
import { erc20ABI, useAccount, useNetwork, useSigner } from 'wagmi';
import { sendTransaction, prepareSendTransaction } from '@wagmi/core';
import { cgAxios } from '../../axios';

import { ethTokendata } from '../../assets/goerli-tokens';
import { SwapModal } from '../../components/dex/SwapModal';
import { TokenInputRow } from '../../components/dex/TokenInputRow';
import { Modal } from '../../components/ui/modal/Modal';
import { Side, Token, TokenPair } from '../../types/types';
import { fetchTokenList, getQuote, getChainData } from './dex.service';

export const Dex = () => {
  const { address } = useAccount();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  console.log('🚀  file: Dex.tsx:21  chain', chain)
  const [currentPair, setCurrentPair] = useState<TokenPair>({
    sell: ethTokendata,
    buy: null,
  });
  const [side, setSide] = useState<Side>('sell');
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formValue, setFormValue] = useState<{ amount: number; side: Side }>({
    amount: 0,
    side: 'sell',
  });
  const [pairPrice, setPairPrice] = useState<any>(null);

  const fetchAndSetTokenList = useCallback(async () => {
    console.log('fetching tokens');
    console.log('chain: ', chain);
    const tokenList = await fetchTokenList(chain?.id);
    setTokenList(tokenList.tokens);
  }, [chain]);

  const getPrice = 
  // useCallback(
    async (value?: number) => {
      if (!currentPair.sell || !currentPair.buy) return;
      const valueToSend = value ? value : formValue.amount;
      console.log('🚀  file: Dex.tsx:50  valueToSend', valueToSend);
      if (valueToSend <= 0) return;

      const sellOrBuy: string = formValue.side === 'sell' ? 'sellAmount' : 'buyAmount';
      console.log('🚀  file: Dex.tsx:58  sellOrBuy', sellOrBuy);
      const { sell: sellToken, buy: buyToken } = currentPair;
      const params = {
        sellToken: sellToken.address,
        // sellToken: sellToken.symbol,
        buyToken: buyToken.address,
        [sellOrBuy]: (Number(valueToSend) * 10 ** sellToken.decimals).toString(),
      };

      try {
        console.log('fetchig price...');
        const { data } = await cgAxios.get('/swap/v1/price', { params });
        console.log('🚀  file: Dex.tsx:70  data', data);
        setPairPrice(data);
      } catch (error) {
        console.log(error);
      }
    }
  //   ,
  //   [currentPair, formValue, chain]
  // );

  useEffect(() => {
    getPrice();
  }, [currentPair, chain, formValue]);

  // const { data, isLoading, isSuccess, write } = useContractWrite(await getQuote())

  // handleSwap --------------------------------
  const handleSwap = async () => {
    console.log('handleSwap...');
    const { side, amount } = formValue;
    if (!address || !signer || !currentPair.sell || !currentPair.buy || !side || !amount) return;

    // const approvalAmountBn = ethers.BigNumber.from('2').pow('256').sub('1');
    const sellTokenAddress = currentPair.sell.address;
    const { zeroXExchangeProxy } = getChainData();
    const sellTokenContract = new ethers.Contract(sellTokenAddress, erc20ABI, signer);

    // approve allowance
    try {
      console.log('checking allowance...');
      const allowanceBn = await sellTokenContract.allowance(address, zeroXExchangeProxy);
      console.log('🚀  file: Dex.tsx:100  allowanceBn', allowanceBn);
      const allowance = ethers.utils.formatUnits(allowanceBn);
      const allowance2 = ethers.utils.formatUnits(allowanceBn, 18).toString();
      const allowance3 = ethers.utils.formatEther(allowanceBn).toString();
      console.log('🚀  file: Dex.tsx:101  allowance', allowance, typeof allowance);
      console.log('🚀  file: Dex.tsx:102  allowance2', allowance2);
      console.log('🚀  file: Dex.tsx:104  allowance3', allowance3);

      // const approvalAmountBn = ethers.BigNumber.from('2').pow('256').sub('1'); // max uint256
      const approvalAmountBn = ethers.utils.parseEther(
        (amount * 10 ** currentPair.sell.decimals).toString()
      );
      if (Number(allowance) < amount) {
        // if (true) {
        console.log('getting approval');

        // approve -------------------
        const txApproval = await sellTokenContract.approve(
          zeroXExchangeProxy,
          // (amount * 10 ** currentPair.sell.decimals).toString()
          approvalAmountBn
        );
        console.log('after............');
        const approvalReceipt = await txApproval.wait(); // prob not needed. Doesn't usuallu take this long.
        console.log('🚀  file: Dex.tsx:94  approvalReceipt', approvalReceipt);
      }
    } catch (error) {
      console.log(error);
      return;
    }

    // 250 00000000 0000000000.0

    console.log('getting quote...');
    const quote = await getQuote(currentPair, side, amount, address);
    console.log('🚀  file: Dex.tsx:94  quote', quote);

    try {
      const params = {
        // from: address,
        from: quote.from,
        to: quote.to,
        data: quote.data,
        value: quote.value,
        // gasPrice: quote.gasPrice,
        gasLimit: quote.gas,
      };

      const config = await prepareSendTransaction({
        chainId: quote.chainId,
        // request: quote,
        request: params,
        // request: {...quote, gasLimit: quote.gas},
        signer: signer,
      });

      // const receipt = await web3.eth.sendTransaction(quote); // This works
      console.log('before send transaction ***********');
      const { hash, wait } = await sendTransaction(config);
      const txReceipt = await wait(1);
      console.log('🚀  file: Dex.tsx:138  txReceipt', txReceipt);

      console.log('🚀  file: Dex.tsx:118  hash', hash);
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleModal = async (side: Side) => {
    await fetchAndSetTokenList();
    setSide(side);
    setModalVisible((prev: Boolean) => !prev);
  };

  const handleFlipBuySell = () => {
    setCurrentPair((prev: TokenPair) => ({
      sell: prev.buy,
      buy: prev.sell,
    }));
  };

  const handleValueChange = (e: ChangeEvent<HTMLInputElement>, side: Side) => {
    const value = Number(e.target.value);
    setFormValue({ amount: value, side });
    if (value <= 0) {
      setPairPrice(null);
    }
    // if (value > 0) {
    //   getPrice(value);
    // } else {
    //   setPairPrice(null);
    // }
  };

  return (
    <>
      <Modal visible={modalVisible} setVisible={setModalVisible}>
        <SwapModal
          side={side}
          tokens={tokenList}
          setPair={setCurrentPair}
          setModalVisible={setModalVisible}
        />
      </Modal>
      <section className='card card-compact max-w-md bg-primary text-primary-content mx-4'>
        <div className='card-body '>
          <h2 className='card-title'>Swap tokens</h2>
          <div className='w-full relative'>
            <TokenInputRow
              side='sell'
              // value={formValue} // fix this
              toggleModal={handleToggleModal}
              pair={currentPair}
              valueChange={e => handleValueChange(e, 'sell')}
            />
            <div className='flip-button' onClick={handleFlipBuySell}>
              <MdOutlineSwapVert size='2rem' />
            </div>
            <TokenInputRow
              side='buy'
              // value={pairPrice.buyAmount ? pairPrice?.buyAmount / 10 ** currentPair?.buy?.decimals : 0}
              toggleModal={handleToggleModal}
              pair={currentPair}
              valueChange={e => handleValueChange(e, 'buy')}
            />
          </div>
          {pairPrice && (
            <div className='w-full flex gap-4 justify-between items-center rounded-lg bg-slate-500 mb-1 px-4 py-2'>
              <div className='flex gap-2 items-center'>
                <MdOutlineInfo />
                <p>
                  1 {currentPair.sell?.symbol} = {Number(pairPrice?.price).toPrecision(4)}{' '}
                  {currentPair.buy?.symbol}
                </p>
              </div>
              <p>Estimated gas: {pairPrice.estimatedGas} </p>
              <FaAngleDown />
            </div>
          )}

          <div className='card-actions justify-end'>
            <button onClick={handleSwap} className='btn w-full'>
              Swap
            </button>
            {currentPair.buy && formValue.amount > 0 && (
              <>
                <p>decimals: {currentPair.buy?.decimals} </p>
                <p>
                  amount to buy:{' '}
                  {(pairPrice?.buyAmount / 10 ** currentPair.buy?.decimals).toPrecision(4)}{' '}
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
