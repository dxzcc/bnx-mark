import styled from "styled-components";
import Web3 from "web3";
import {
  Table,
  Button,
  Tag,
  Space,
  InputNumber,
  Dropdown,
  Notification,
  Typography,
} from "@douyinfe/semi-ui";
import { GoldColums, GoldMColums } from "../utils/colums";
import { initWeb3, isMobile } from "../utils/util";
import { useEffect, useState } from "react";
import {
  gongzuo_type1,
  gongzuo_type2,
  gongzuo_type3,
  gongzuo_type4,
  gongzuo_type5,
  gongzuo_type6,
  gongzuo_type7,
  gongzuo_type8,
  Robber,
  Warrior,
  Ranger,
  Mage,
  Katrina,
  multiples,
  gongzuo_type_zh,
  prices,
} from "../utils/emuns";
import { filterHegeOne } from "../utils/util";
import NowAddress from "../components/NowAddress";


const MyHeroContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 20px;
`;


const Gold = ({ address, contracts }) => {
  const [filterWorkType, setFilterWorkType] = useState("");
  const [workLoad, setWorkLoad] = useState(false);
  const [goldTotal, setGoldTotal] = useState(0);
  const [budgetGoldTotal, setBudgetGoldTotal] = useState(0);
  const [gongzuoList, setGongZuoList] = useState([]);
  const [myWorkCardSelectedList, setMyWorkCardSelectedList] = useState([]);
  const [work, setWord] = useState(false); // 收菜, 退出工作
  const [filterGold, setFilterGold] = useState(1000);
  const [selectedRowKeys, setselectedRowKeys] = useState([]);

  useEffect(() => {
    setMyWorkCardSelectedList([]);
    setselectedRowKeys([]);
    getWordCards();
  }, [address]);

  // 工作中的卡
  const getWordCards = () => {
    if (!address || !contracts) {
      Notification.info({ content: "3秒后不显示钱包地址, 请刷新网页" });
      return;
    }
    const web3 = initWeb3(Web3.givenProvider);
    const types = [
      gongzuo_type1,
      gongzuo_type2,
      gongzuo_type3,
      gongzuo_type4,
      gongzuo_type5,
      gongzuo_type6,
      gongzuo_type7,
      gongzuo_type8,
    ];
    setWorkLoad(true);
    setGongZuoList([]);
    setBudgetGoldTotal(0);
    setGoldTotal(0);
    setselectedRowKeys([]);
    setMyWorkCardSelectedList([]);

    const allFetchPromises = types.map((item) => {
      return new Promise((resolve) => {
        fetch(
          `https://game.binaryx.pro/minev2/getWorks?address=${address}&work_type=${item}`
        )
          .then((res) => {
            return res.json();
          })
          .then((res) => {
            // console.log(res);
            const list = res.data.result;
            let nlist = [];
            if (list) {
              nlist = list.map((item) => {
                return {
                  ...item,
                  name: gongzuo_type_zh(item.work_type),
                };
              });
            }
            resolve(nlist);
          });
      });
    });

    Promise.all(allFetchPromises).then((res) => {
      let list = res.reduce((pre, item) => {
        return [...pre, ...item];
      }, []);
      list = list.map(async (item) => {
        const work = await (item.name === "兼职"
          ? contracts.MiningContract
          : contracts.NewMiningContract
        ).methods
          .getPlayerWork(item.token_id)
          .call()
          .catch((err) => console.log(err));
        const info = await contracts.NewPlayInfoContract.methods
          .getPlayerInfoBySet(item.token_id)
          .call()
          .catch((err) => console.log(err));
        const endtime = await web3.eth.getBlockNumber();
        let typeContract;
        switch (item.name) {
          case "兼职":
            typeContract = contracts.LgongContract;
            break;
          case "伐木":
            typeContract = contracts.BlacksmithContract;
            break;
          case "酿酒":
            typeContract = contracts.HunterContract;
            break;
          case "卷轴":
            typeContract = contracts.BookmangerContract;
            break;
          case "打猎":
            typeContract = contracts.RangeworkContract;
            break;
          default:
            typeContract = contracts.LgongContract;
            break;
        }
        const gold = await typeContract.methods
          .getIncome(info[0], work.startTime, endtime + "")
          .call()
          .catch((err) => console.log(err));
        //   console.log(gold)
        return {
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
          token_id: item.token_id,
          workname: item.name,
          gold: Number(gold / Math.pow(10, 18)).toFixed(2),
        };
      });
      Promise.all(list).then((res) => {
        setWorkLoad(false);
        setGongZuoList(res);
        const total = res.reduce((pre, item) => {
          return Number(pre) + Number(item.gold);
        }, 0);
        const hgtotal = res.reduce((pre, item) => {
          let hege = false;
          switch (item.career_address) {
            case Robber:
              hege = filterHegeOne(item, Robber, "agility", "strength");
              break;
            case Ranger:
              hege = filterHegeOne(item, Ranger, "strength", "agility");
              break;
            case Warrior:
              hege = filterHegeOne(item, Warrior, "strength", "physique");
              break;
            case Katrina:
              hege = filterHegeOne(item, Katrina, "strength", "physique");
              break;
            case Mage:
              hege = filterHegeOne(item, Mage, "brains", "charm");
              break;
          }
          if (hege && item.level >= 2) {
            let value = 0;
            switch (item.career_address) {
              case Robber:
                value = item.agility;
                break;
              case Ranger:
                value = item.strength;
                break;
              case Warrior:
                value = item.strength;
                break;
              case Katrina:
                value = item.strength;
                break;
              case Mage:
                value = item.brains;
                break;
            }
            const mainValue =
              Number(prices[value]) * Number(multiples[item.level]);
            return pre + mainValue;
          }
          if (!hege && item.level > 1) {
            return pre + 288 * Number(multiples[item.level]);
          }
          return pre + 288;
        }, 0);
        setBudgetGoldTotal(hgtotal);
        setGoldTotal(total);
      });
    });
  };

  const getGold = (all, type = 0) => {
    return () => {
      if (!address || !contracts) {
        Notification.info({ content: "3秒后不显示钱包地址, 请刷新网页" });
        return;
      }
      if (type === 1) {
        const a = gongzuoList.filter((item) => item.workname === "兼职");
        if (a.length === 0) {
          Notification.error({ content: "你没有黑奴可收" });
          return;
        }
        const web3 = initWeb3(Web3.givenProvider);
        web3.eth.sendTransaction(
          {
            from: address,
            to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
            value: `${0.002 * Math.pow(10, 18)}`,
          },
          (err, hash) => {
            if (hash) {
              Notification.info({
                content: "正在获取收益中, 请稍后",
                duration: 10,
              });
              a.forEach((item, index) => {
                contracts.MiningContract.methods
                  .getAward(item.token_id)
                  .send({ from: address })
                  .then(() => getWordCards())
                  .catch((err) => console.log(err));
              });
            }
          }
        );
      } else if (type === 2) {
        const x = gongzuoList.filter((item) => item.workname !== "兼职");
        if (x.length === 0) {
          Notification.error({ content: "你没有合格可收" });
          return;
        }
        const web3 = initWeb3(Web3.givenProvider);
        web3.eth.sendTransaction(
          {
            from: address,
            to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
            value: `${0.002 * Math.pow(10, 18)}`,
          },
          (err, hash) => {
            if (hash) {
              Notification.info({
                content: "正在获取收益中, 请稍后",
                duration: 10,
              });
              if (hash) {
                x.forEach((item, index) => {
                  contracts.NewMiningContract.methods
                    .getAward(item.token_id)
                    .send({ from: address })
                    .then(() => getWordCards())
                    .catch((err) => console.log(err));
                });
              }
            }
          }
        );
      } else {
        const web3 = initWeb3(Web3.givenProvider);
        web3.eth.sendTransaction(
          {
            from: address,
            to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
            value: `${0.002 * Math.pow(10, 18)}`,
          },
          (err, hash) => {
            if (hash) {
              Notification.info({
                content: "正在获取收益中, 请稍后",
                duration: 10,
              });
              (all ? gongzuoList : myWorkCardSelectedList).forEach(
                (item, index) => {
                  if (item.workname === "兼职") {
                    contracts.MiningContract.methods
                      .getAward(item.token_id)
                      .send({ from: address })
                      .then(() => getWordCards())
                      .catch((err) => console.log(err));
                  } else {
                    contracts.NewMiningContract.methods
                      .getAward(item.token_id)
                      .send({ from: address })
                      .then(() => getWordCards())
                      .catch((err) => console.log(err));
                  }
                }
              );
            }
          }
        );
      }
    };
  };

  const getBlockGold = (num) => {
    return () => {
      if (!address || !contracts) {
        Notification.info({ content: "3秒后不显示钱包地址, 请刷新网页" });
        return;
      }
      const a = gongzuoList
        .filter((item) => item.workname === "兼职")
        .filter((item) => item.gold >= num);
      if (a.length === 0) {
        Notification.error({ content: `你没有黑奴满${num}可收` });
        return;
      }
      const web3 = initWeb3(Web3.givenProvider);
      web3.eth.sendTransaction(
        {
          from: address,
          to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
          value: `${0.002 * Math.pow(10, 18)}`,
        },
        (err, hash) => {
          if (hash) {
            Notification.info({
              content: "正在获取收益中, 请稍后",
              duration: 10,
            });
            a.forEach((item, index) => {
              contracts.MiningContract.methods
                .getAward(item.token_id)
                .send({ from: address })
                .then(() => getWordCards())
                .catch((err) => console.log(err));
            });
          }
        }
      );
    };
  };

  const getFilterGold = () => {
    if (!address || !contracts) {
      Notification.info({ content: "3秒后不显示钱包地址, 请刷新网页" });
      return;
    }
    if (!filterWorkType) {
      Notification.error({ content: "请选择工作类型" });
      return;
    }
    const workname = gongzuo_type_zh(filterWorkType);
    const a = gongzuoList.filter((item) => item.workname === workname);
    if (a.length === 0) {
      Notification.error({ content: `你没有${workname}可收` });
      return;
    }
    const g = gongzuoList.filter((item) => item.gold >= filterGold);
    if (g.length === 0) {
      Notification.error({ content: `你没有金币满${filterGold}的卡可收` });
      return;
    }
    Notification.info({ content: "正在获取收益中, 请稍后", duration: 10 });
    const web3 = initWeb3(Web3.givenProvider);
    web3.eth.sendTransaction(
      {
        from: address,
        to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
        value: `${0.002 * Math.pow(10, 18)}`,
      },
      (err, hash) => {
        if (hash) {
          g.forEach((item, index) => {
            if (item.workname === "兼职") {
              contracts.MiningContract.methods
                .getAward(item.token_id)
                .send({ from: address })
                .then(() => getWordCards(address))
                .catch((err) => console.log(err));
            } else {
              contracts.NewMiningContract.methods
                .getAward(item.token_id)
                .send({ from: address })
                .then(() => getWordCards(address))
                .catch((err) => console.log(err));
            }
          });
        }
      }
    );
  };

  const quitWork = (all, num = 0) => {
    return () => {
      if (!address) {
        Notification.info({ content: "3秒后不显示钱包地址, 请刷新网页" });
        return;
      }
      let list = all ? gongzuoList : myWorkCardSelectedList;
      if (num > 0) {
        list = list.filter((item) => item.level === num);
      }
      if (list.length === 0) {
        Notification.error({ content: "你没卡可以退出工作" });
        return;
      }
      Notification.info({ content: "正在炒老板鱿鱼中, 请稍后", duration: 10 });
      const web3 = initWeb3(Web3.givenProvider);
      web3.eth.sendTransaction(
        {
          from: address,
          to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
          value: `${0.002 * Math.pow(10, 18)}`,
        },
        (err, hash) => {
          if (hash) {
            list.forEach((item, index) => {
              if (item.workname === "兼职") {
                contracts.MiningContract.methods
                  .quitWork(item.token_id)
                  .send({ from: address })
                  .then(() => getWordCards(address))
                  .catch((err) => console.log(err));
              } else {
                contracts.NewMiningContract.methods
                  .quitWork(item.token_id)
                  .send({ from: address })
                  .then(() => getWordCards(address))
                  .catch((err) => console.log(err));
              }
            });
          }
        }
      );
    };
  };

  return (
    <MyHeroContainer>
      <Typography.Title style={{ textAlign: "center" }}>
        日常挖矿
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
          disabled={!work}
          onClick={getGold(false)}
        >
          收菜
        </Button>
        <Button
          type="primary"
          style={{ margin: 3 }}
          disabled={!work}
          onClick={quitWork(false)}
        >
          辞职
        </Button>
        <Button type="primary" style={{ margin: 3 }} onClick={getGold(true, 1)}>
          收全黑
        </Button>
        <Button
          type="primary"
          style={{ margin: 3 }}
          onClick={getBlockGold(2000)}
        >
          黑满2000
        </Button>
        <Button
          type="primary"
          style={{ margin: 3 }}
          onClick={getBlockGold(3000)}
        >
          黑满3000
        </Button>
        <Button
          type="primary"
          style={{ margin: 3 }}
          onClick={getBlockGold(4000)}
        >
          黑满4000
        </Button>
        <Button type="primary" style={{ margin: 3 }} onClick={getGold(true, 2)}>
          收2级工作
        </Button>
        <Button type="primary" style={{ margin: 3 }} onClick={getWordCards}>
          刷新
        </Button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: 20,
          flexWrap: "wrap",
        }}
      >
        <InputNumber
          precision={2}
          defaultValue={filterGold}
          onChange={(value) => setFilterGold(value)}
        />
        <Dropdown
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setFilterWorkType(gongzuo_type1)}>
                兼职
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterWorkType(gongzuo_type3)}>
                伐木
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterWorkType(gongzuo_type2)}>
                酿酒
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterWorkType(gongzuo_type4)}>
                抄录
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setFilterWorkType(gongzuo_type5)}>
                打猎
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button type="tertiary" style={{ margin: 3 }}>
            {gongzuo_type_zh(filterWorkType) || "选择工作类型"}
          </Button>
        </Dropdown>
        <Button type="primary" style={{ margin: 3 }} onClick={getFilterGold}>
          过滤收菜
        </Button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: 20,
          flexWrap: "wrap",
        }}
      >
        <Space
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Tag>挖矿卡片数量: {gongzuoList.length}</Tag>
          <Tag>每日预计收益: {budgetGoldTotal}</Tag>
          <Tag>挖矿总收益: {goldTotal.toFixed(2)}</Tag>
        </Space>
      </div>
      <p style={{ width: "100%", textAlign: "center" }}>
        每次点击相关操作按钮前, 都需要支付0.002BNB手续费
      </p>
      {myWorkCardSelectedList.length > 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: 5,
            flexWrap: "wrap",
          }}
        >
          <p style={{ color: "var(--semi-color-text-0)" }}>
            已选中: {myWorkCardSelectedList.length}
          </p>
        </div>
      ) : (
        ""
      )}
      <Table
        rowKey={(record) => record.token_id}
        columns={isMobile() ? GoldMColums : GoldColums}
        rowSelection={{
          selectedRowKeys: selectedRowKeys,
          onChange: (selectedRowKeys, selectedRows) => {
            setWord(selectedRows.length > 0);
            setselectedRowKeys(selectedRowKeys);
            setMyWorkCardSelectedList(selectedRows);
          },
        }}
        dataSource={gongzuoList}
        pagination={{
          formatPageText: !isMobile(),
        }}
        bordered
      />
    </MyHeroContainer>
  );
};

export default Gold;
