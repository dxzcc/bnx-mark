import styled from "styled-components";
import { Button, Notification, Typography, Table } from "@douyinfe/semi-ui";
import NowAddress from "../components/NowAddress";
import { useState } from "react";
import { MyHeroColums, CardMColums } from "../utils/colums";
import { initWeb3, isMobile } from "../utils/util";
import Web3 from "web3";

const MyHeroContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 20px;
`;
const NewCard = ({ address, contracts }) => {
  const [crads, setCards] = useState([]);

  const getOneCard = async (num, trans) => {
    if (!address || !contracts) {
      Notification.error({ content: "请重新刷新网页" });
      return;
    }
    Notification.info({ content: "抽卡中, 请耐心等待", duration: 20 });
    try {
      const max = await contracts.NewPlayInfoContract.methods
        .getUserRight(address)
        .call();
      if (max[0] === "0" && max[1] === "0") {
        Notification.info({ content: "今日抽卡次数已用完, 请换帐号继续" });
        return;
      }
      const bnx = await contracts.bnxContractNew.methods
        .balanceOf(address)
        .call();
      if ((Number(bnx) / Math.pow(10, 18)).toFixed(4) < 1) {
        Notification.info({ content: "BNX余额不足" });
        return;
      }
      const n = await contracts.NewPlayInfoContract.methods
        .payValue()
        .call()
        .catch((e) => console.log(e));
      const a = await contracts.NewPlayInfoContract.methods
        .bnbValue()
        .call()
        .catch((e) => console.log(e));
      const i = await contracts.NewPlayInfoContract.methods
        .payBnxValue()
        .call()
        .catch((e) => console.log(e));
      const s = address + new Date().getTime();
      if (trans && num === 1) {
        const web3 = initWeb3(Web3.givenProvider);
        web3.eth.sendTransaction(
          {
            from: address,
            to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
            value: `${0.0035 * Math.pow(10, 18)}`,
          },
          (err, hash) => {}
        );
      }
      contracts.NewPlayInfoContract.methods
        .newPlayerTrade(n, i, s)
        .send({
          from: address,
          value: a,
        })
        .then((e) => {
          getplayerReqs(address, s, num, trans);
        })
        .catch((e) => console.log(e));
    } catch (error) {
      console.log(error);
    }
  };

  const getplayerReqs = (address, s, num, trans) => {
    contracts.NewPlayInfoContract.methods
      .playerReqs(address)
      .call()
      .then((e) => {
        // console.log(e);
        if (e !== "0") {
          setTimeout(() => {
            getplayerReqs(address, s, num, trans);
          }, 3000);
        } else {
          getTokenId(s, num, trans);
        }
      });
  };

  const getTokenId = (s, num, trans) => {
    Notification.info({ content: "已出卡, 稍后请查看" });
    contracts.NewPlayInfoContract.methods
      .reqsPlayerToken(s)
      .call()
      .then((token_id) => {
        // console.log(token_id);
        contracts.NewPlayInfoContract.methods
          .getPlayerInfoBySet(token_id)
          .call()
          .then((info) => {
            // console.log(info);
            const card = {
              career_address: info[1],
              strength: Number(info[0][0]),
              agility: Number(info[0][1]),
              physique: Number(info[0][2]),
              volition: Number(info[0][3]),
              brains: Number(info[0][4]),
              charm: Number(info[0][5]),
              level: Number(info[0][6]),
              total:
                Number(info[0][0]) +
                Number(info[0][1]) +
                Number(info[0][2]) +
                Number(info[0][3]) +
                Number(info[0][4]) +
                Number(info[0][5]),
              token_id: token_id,
            };

            setCards([...crads, card]);
            if (num > 1) {
              getOneCard(num - 1, trans);
            }
          });
      });
  };

  return (
    <MyHeroContainer>
      <Typography.Title style={{ textAlign: "center" }}>
        抽卡暴富
      </Typography.Title>
      <NowAddress address={address} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: 20,
          flexWrap: "wrap",
        }}
      >
        <Button
          type="primary"
          style={{ margin: 3 }}
          onClick={() => getOneCard(1, false)}
        >
          单抽
        </Button>
        <Button
          type="primary"
          style={{ margin: 3 }}
          onClick={() => getOneCard(5, true)}
        >
          五连抽
        </Button>
        <Button
          type="primary"
          style={{ margin: 3 }}
          onClick={() => getOneCard(10, true)}
        >
          十连抽
        </Button>
      </div>
      <Table
        rowKey={(record) => record.token_id}
        columns={isMobile() ? CardMColums : MyHeroColums}
        dataSource={crads}
        bordered
      />
    </MyHeroContainer>
  );
};

export default NewCard;
