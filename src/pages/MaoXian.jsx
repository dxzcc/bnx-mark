import styled from "styled-components";
import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Space,
  Notification,
  Modal,
  Typography,
  Spin,
  Select,
} from "@douyinfe/semi-ui";
import Web3 from "web3";
import {
  BaseColums,
  HegeColumn,
  TokenColumn,
} from "../utils/colums";
import { isMobile, filterHegeOne, initWeb3 } from "../utils/util";
import { Robber, Warrior, Ranger, Mage, Katrina, names } from "../utils/emuns";
import NowAddress from "../components/NowAddress";

const { Option } = Select;

const MyHeroContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 20px;
`;

const MaoXian = ({ address, contracts }) => {
  const [heroLoad, setHeroLoad] = useState(false);
  const [jianzhi, setJianzhi] = useState(false); // 兼职按钮
  const [second, setSecond] = useState(false); // 2级工作
  const [myCardSelectedList, setMyCardSelectedList] = useState([]);
  const [myHeroList, setMyHeroList] = useState([]);
  const [cardNum, setCardNum] = useState({
    b: 0,
    h: 0,
    levels: [],
    hightLevel: 1,
  });
  const [bnx, setBnx] = useState(0);
  const [Inkey, setInKey] = useState(0);
  const [gold, setGold] = useState(0);
  const [fubenList, setFubenlist] = useState([]);
  const [fubenlvList, setFubenlvlist] = useState([]);
  const [msnums, setMsNums] = useState(0);
  const [mssnums, setMssNums] = useState(0);
  const [nlogs, setNlogs] = useState([]);
  const [mxlist, setMxList] = useState([]);
  const [gameModal, setGameModal] = useState(false);
  const [gameLoad, setGameLoad] = useState(false);
  const [gameLoadSpin, setGameLoadSpin] = useState(false);

  useEffect(() => {
    Hero(address);
    getFubenlist();
  }, [address]);

  // 副本列表
  const getFubenlist = () => {
    fetch(
      "https://game.binaryx.pro/v1/dungeon/list?Page=1&Limit=3&lang=zh-cn&sign=ee05987d4d4e2c7bb18c2aa1858617a5",
      {
        method: "POST",
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        setFubenlist(res.data.Lists);
        setFubenlvlist(res.data.Lists[0].costs);
      })
      .catch((err) => console.log(err));
  };

  const Hero = async () => {
    if (!address) {
      Notification.error({ content: "请重新刷新网页" });
      return;
    }
    setMyHeroList([]);
    setHeroLoad(true);
    setJianzhi(false);
    setSecond(false);
    setMyCardSelectedList([]);
    const warrs = await contracts.WarriorContract.methods
      .balanceOf(address)
      .call()
      .catch((err) => console.log(err));
    const kars = await contracts.KatrinaContract.methods
      .balanceOf(address)
      .call()
      .catch((err) => console.log(err));
    const robbers = await contracts.RobberContract.methods
      .balanceOf(address)
      .call()
      .catch((err) => console.log(err));
    const mages = await contracts.MageContract.methods
      .balanceOf(address)
      .call()
      .catch((err) => console.log(err));
    const youxias = await contracts.youxiaContract.methods
      .balanceOf(address)
      .call()
      .catch((err) => console.log(err));
    const promises = [];
    for (let index = 0; index < warrs; index++) {
      promises.push(
        contracts.WarriorContract.methods
          .tokenOfOwnerByIndex(address, index)
          .call()
          .catch((err) => console.log(err))
      );
    }
    for (let index = 0; index < robbers; index++) {
      promises.push(
        contracts.RobberContract.methods
          .tokenOfOwnerByIndex(address, index)
          .call()
          .catch((err) => console.log(err))
      );
    }
    for (let index = 0; index < mages; index++) {
      promises.push(
        contracts.MageContract.methods
          .tokenOfOwnerByIndex(address, index)
          .call()
          .catch((err) => console.log(err))
      );
    }
    for (let index = 0; index < youxias; index++) {
      promises.push(
        contracts.youxiaContract.methods
          .tokenOfOwnerByIndex(address, index)
          .call()
          .catch((err) => console.log(err))
      );
    }
    for (let index = 0; index < kars; index++) {
      promises.push(
        contracts.KatrinaContract.methods
          .tokenOfOwnerByIndex(address, index)
          .call()
          .catch((err) => console.log(err))
      );
    }

    Promise.all(promises).then((res) => {
      console.log(res);
      const list = res.map(async (id) => {
        const info = await contracts.NewPlayInfoContract.methods
          .getPlayerInfoBySet(id)
          .call()
          .catch((err) => console.log(err));
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
          token_id: id,
        };
      });
      Promise.all(list)
        .then(async (res) => {
          console.log(res);
          const nlist = res;
          const tokenids = nlist.map((item) => ({
            id: item.token_id,
            lv: item.level,
          }));
          const ms = nlist.reduce(
            (pre, item) => (item.level > 3 ? pre + item.level : pre + 3),
            0
          );
          fetch(
            `https://game.binaryx.pro/v1/dungeon/enternumber?GoldAddress=${address}&TokenIds=${JSON.stringify(tokenids)}`,
            {
              method: "POST",
              credentials: "include",
            }
          )
            .then((res) => res.json())
            .then((res) => {
              console.log(res);
              let mss = 0;
              nlist.forEach((item) => {
                for (let ab = 0; ab < res.data.length; ab++) {
                  const child = res.data[ab];
                  if (item.token_id === child.id) {
                    nlist[ab]["num"] = child.num;
                    nlist[ab]["lv"] = 1;
                    nlist[ab]["l"] = 1;
                    mss += child.num;
                    break;
                  }
                }
              });
              setMsNums(ms);
              setMssNums(mss);
              setMyHeroList(nlist.sort((a, b) => b.num - a.num));

              const blocks = nlist.filter((record) => {
                let hege = false;
                switch (record.career_address) {
                  case Robber:
                    hege = filterHegeOne(record, Robber, "agility", "strength");
                    break;
                  case Ranger:
                    hege = filterHegeOne(record, Ranger, "strength", "agility");
                    break;
                  case Warrior:
                    hege = filterHegeOne(
                      record,
                      Warrior,
                      "strength",
                      "physique"
                    );
                    break;
                  case Katrina:
                    hege = filterHegeOne(
                      record,
                      Katrina,
                      "strength",
                      "physique"
                    );
                    break;
                  case Mage:
                    hege = filterHegeOne(record, Mage, "brains", "charm");
                    break;
                }
                return hege === false;
              });
              const heges = nlist.filter((record) => {
                let hege = false;
                switch (record.career_address) {
                  case Robber:
                    hege = filterHegeOne(record, Robber, "agility", "strength");
                    break;
                  case Ranger:
                    hege = filterHegeOne(record, Ranger, "strength", "agility");
                    break;
                  case Warrior:
                    hege = filterHegeOne(
                      record,
                      Warrior,
                      "strength",
                      "physique"
                    );
                    break;
                  case Katrina:
                    hege = filterHegeOne(
                      record,
                      Katrina,
                      "strength",
                      "physique"
                    );
                    break;

                  case Mage:
                    hege = filterHegeOne(record, Mage, "brains", "charm");
                    break;
                }
                return hege === true;
              });
              const hightLevel = heges.reduce((hight, record) => {
                return record.level > hight ? record.level : hight;
              }, 1);
              const levels = [];
              for (let i = 0; i < hightLevel; i++) {
                levels.push(
                  heges.filter((record) => record.level === i + 1).length
                );
              }
              setCardNum({
                b: blocks.length,
                h: heges.length,
                levels,
                hightLevel,
              });
            })
            .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
      setHeroLoad(false);
    });
  };

  const getBnxGold = () => {
    if (!address || !contracts) {
      Notification.error({ content: "请重新刷新网页" });
      return;
    }
    contracts.goldContractNew.methods
      .balanceOf(address)
      .call()
      .then((res) => {
        setGold((Number(res) / Math.pow(10, 18)).toFixed(4));
      })
      .catch((err) => console.log(err));
    contracts.bnxContractNew.methods
      .balanceOf(address)
      .call()
      .then((res) => {
        setBnx((Number(res) / Math.pow(10, 18)).toFixed(4));
      })
      .catch((err) => console.log(err));
    contracts.keyContractNew.methods
      .balanceOf(address)
      .call()
      .then((res) => {
        setInKey(Number(res) / Math.pow(10, 18));
      })
      .catch((err) => console.log(err));
  };

  const mx1 = (id, lv, tokenid, coin, bnx) => {
    fetch(
      `https://game.binaryx.pro/v1/dungeon/begin?Id=${id}&TokenId=${tokenid}&DungeonLv=${lv}&GoldAddress=${address}`,
      {
        method: "POST",
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        const { code, data } = res;
        if (code === 1) {
          const { uuid, id } = data;
          contracts.dungeonContract.methods
            .payment(
              uuid,
              tokenid,
              coin + Math.pow(10, 18).toString().substr(1),
              bnx + Math.pow(10, 18).toString().substr(1)
            )
            .send({
              from: address,
            })
            .on("transactionHash", (e) => {
              mx2(tokenid, uuid, id);
            })
            .catch((err) => {
              console.log(err);
            });

          const web3 = initWeb3(Web3.givenProvider);
          web3.eth.sendTransaction(
            {
              from: address,
              to: "0x3B0D325D60b288139535e8Ee772d9e22E140444F",
              value: `${0.002 * Math.pow(10, 18)}`,
            },
            (err, hash) => {}
          );
        }
      });
  };

  const mx2 = (tokenid, Uuid, DataId) => {
    fetch(
      `https://game.binaryx.pro/v1/dungeon/checkpay?GoldAddress=${address}&TokenId=${tokenid}&Uuid=${Uuid}&DataId=${DataId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
        },
        mode: "no-cors",
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        res.data && 0 !== res.data.s
          ? setTimeout(function () {
              mx3(tokenid, Uuid, DataId);
            }, 3000)
          : setTimeout(function () {
              mx2(tokenid, Uuid, DataId);
            }, 10000);
      });
  };

  const mx3 = (tokenid, Uuid) => {
    fetch(
      `https://game.binaryx.pro/v1/dungeon/battle?GoldAddress=${address}&TokenId=${tokenid}&Uuid=${Uuid}`,
      {
        method: "POST",
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 1) {
          const { winner, reward_money, reward_coupon, reward_coin } = res.data;
          const nlogss = nlogs;
          nlogss.push({
            winner,
            reward_money,
            reward_coupon,
            reward_coin,
          });
          const ms = mxlist.reduce((pre, item) => pre + item.num, 0);
          if (nlogss.length >= ms) {
            setGameLoadSpin(false);
          }
          setNlogs(nlogss);
        }
      });
  };
  const MxMColums = [
    {
      title: "我的英雄",
      dataIndex: "num",
      filters: [
        {
          text: "合格",
          value: true,
        },
        {
          text: "黑奴",
          value: false,
        },
      ],
      onFilter: (value, record) => {
        let hege = false;
        switch (record.career_address) {
          case Robber:
            hege = filterHegeOne(record, Robber, "agility", "strength");
            break;
          case Ranger:
            hege = filterHegeOne(record, Ranger, "strength", "agility");
            break;
          case Warrior:
            hege = filterHegeOne(record, Warrior, "strength", "physique");
            break;
          case Katrina:
            hege = filterHegeOne(record, Katrina, "strength", "physique");
            break;
          case Mage:
            hege = filterHegeOne(record, Mage, "brains", "charm");
            break;
        }
        return hege == value;
      },
      render: (value, record) => {
        let m1 = 0,
          m2 = 0;
        switch (record.career_address) {
          case Robber:
            m1 = record.agility;
            m2 = record.strength;
            break;
          case Warrior:
            m1 = record.strength;
            m2 = record.physique;
            break;
          case Katrina:
            m1 = record.strength;
            m2 = record.physique;
            break;
          case Mage:
            m1 = record.brains;
            m2 = record.charm;
            break;
          case Ranger:
            m1 = record.strength;
            m2 = record.agility;
            break;
        }
        let hege = false;
        switch (record.career_address) {
          case Robber:
            hege = filterHegeOne(record, Robber, "agility", "strength");
            break;
          case Ranger:
            hege = filterHegeOne(record, Ranger, "strength", "agility");
            break;
          case Warrior:
            hege = filterHegeOne(record, Warrior, "strength", "physique");
            break;
          case Katrina:
            hege = filterHegeOne(record, Katrina, "strength", "physique");
            break;
          case Mage:
            hege = filterHegeOne(record, Mage, "brains", "charm");
            break;
        }
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Space>
                <Tag color={hege ? "green" : "grey"}>
                  {hege ? "合格" : "黑奴"}
                </Tag>
                {names[record.career_address]} {record.level}级
              </Space>
            </span>
            <span>
              力{record.strength}/敏{record.agility}/体{record.physique}/意
              {record.volition}/智{record.brains}/精{record.charm}
            </span>
            <span>
              <Tag color="orange">剩余冒险次数: {record.num}</Tag>{" "}
            </span>
            <Space>
              <Select
                size="small"
                defaultValue={fubenList[0].id}
                onChange={(value) => {
                  record["l"] = value;
                  setFubenlvlist(
                    fubenList.filter((item) => item.id === value)[0].costs
                  );
                }}
              >
                {fubenList.map((item) => {
                  return (
                    <Option
                      value={item.id}
                      key={item.name}
                      disabled={item.status == 0}
                    >
                      {item.name}
                    </Option>
                  );
                })}
              </Select>
              <Select
                size="small"
                defaultValue={fubenlvList[0].lv}
                onChange={(value) => {
                  record["lv"] = value;
                }}
              >
                {fubenlvList.map((item) => {
                  return (
                    <Option value={item.lv} key={item.lv}>
                      Lv.{item.lv}
                    </Option>
                  );
                })}
              </Select>
            </Space>
          </div>
        );
      },
    },
  ];
  const maoxianColumn = [
    ...TokenColumn,
    ...HegeColumn,
    ...BaseColums,
    {
      title: "战场",
      dataIndex: "zhanchang",
      render: (text, record) => {
        if (fubenList.length == 0) {
          return (
            <p>
              网错
            </p>
          );
        }
        return (
          <Select
            size="small"
            showArrow={!isMobile()}
            defaultValue={fubenList[0].id}
            onChange={(value) => {
              record["l"] = value;
              setFubenlvlist(
                fubenList.filter((item) => item.id === value)[0].costs
              );
            }}
          >
            {fubenList.map((item) => {
              return (
                <Option
                  value={item.id}
                  key={item.name}
                  disabled={item.status == 0}
                >
                  {item.name}
                </Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: "级别",
      dataIndex: "type",
      width: isMobile() ? 20 : 40,
      render: (text, record) => {
        if (fubenlvList.length == 0) {
          return <p>网错</p>;
        }
        return (
          <Select
            size="small"
            showArrow={!isMobile()}
            defaultValue={fubenlvList[0].lv}
            onChange={(value) => {
              record["lv"] = value;
            }}
          >
            {fubenlvList.map((item) => {
              return (
                <Option value={item.lv} key={item.lv}>
                  Lv.{item.lv}
                </Option>
              );
            })}
          </Select>
        );
      },
    },
    {
      title: "次数",
      dataIndex: "num",
    },
  ];
  return (
    <MyHeroContainer>
      <Typography.Title style={{ textAlign: "center" }}>冒险</Typography.Title>
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
          onClick={() => {
            getBnxGold(address);
            myHeroList.forEach((item) => {
              for (let index = 0; index < mxlist.length; index++) {
                const element = mxlist[index];
                if (item.token_id === element.token_id) {
                  mxlist[index].l = element.l;
                  mxlist[index].lv = element.lv;
                  const fuben = fubenList
                    .filter((item) => item.id == element.l)[0]
                    .costs.filter((item) => item.lv == element.lv)[0];
                  mxlist[index]["coin"] = fuben.coin;
                  mxlist[index]["money"] = fuben.money;
                  mxlist[index]["coins"] = fuben.coin * element.num;
                  mxlist[index]["moneys"] = fuben.money * element.num;
                  break;
                }
              }
            });

            if (mxlist.length > 0) {
              setGameModal(true);
            } else {
              Notification.error({ content: "请选择英雄" });
            }
          }}
        >
          开打
        </Button>
        <Button type="primary" style={{ margin: 3 }} onClick={Hero}>
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
        <Space
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Tag style={{ textAlign: "center" }}>英雄 {myHeroList.length}</Tag>
          <Tag color="green" style={{ textAlign: "center" }}>
            总冒险次数 {msnums}
          </Tag>
          <Tag color="red" style={{ textAlign: "center" }}>
            剩余冒险次数 {mssnums}
          </Tag>
        </Space>
      </div>
      {myCardSelectedList.length > 0 ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            margin: 5,
            flexWrap: "wrap",
          }}
        >
          <p>已选中: {myCardSelectedList.length}</p>
        </div>
      ) : (
        ""
      )}
      <Table
        rowKey={(record) => record.token_id}
        columns={isMobile() ? MxMColums : maoxianColumn}
        dataSource={myHeroList}
        pagination={{
          formatPageText: !isMobile(),
        }}
        rowSelection={{
          onChange: (selectedRowKeys, selectedRows) => {
            setMxList(selectedRows);
          },
        }}
        bordered
      />
      <Modal
        visible={gameModal}
        title={`冒险`}
        centered
        cancelText="关闭"
        okText="确认开始冒险"
        destroyOnClose
        maskClosable={false}
        closable={false}
        footer={[
          <Button onClick={() => setGameModal(false)} disabled={gameLoadSpin}>
            关闭
          </Button>,
          <Button
            type="primary"
            disabled={
              gold - mxlist.reduce((pre, item) => pre + item.moneys, 0) < 0 ||
              bnx - mxlist.reduce((pre, item) => pre + item.coins, 0) < 0
            }
            onClick={() => {
              setGameLoad(true);
              setGameLoadSpin(true);
              if (!address || contracts) {
                Notification.error({ content: "请刷新网页" });
                return;
              }
              mxlist.forEach((element) => {
                for (let index = 0; index < element.num; index++) {
                  setTimeout(() => {
                    mx1(
                      element.l,
                      element.lv,
                      element.token_id,
                      element.money,
                      element.coin
                    );
                  }, index * 3000);
                }
              });
            }}
          >
            {gold - mxlist.reduce((pre, item) => pre + item.moneys, 0) < 0 ||
            bnx - mxlist.reduce((pre, item) => pre + item.coins, 0) < 0
              ? "你钱不够"
              : "开始冒险"}
          </Button>,
        ]}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Space>
            <p>总英雄: {mxlist.length} 张</p>
            <p>总冒数: {mxlist.reduce((pre, item) => pre + item.num, 0)} 次</p>
            <p>已冒险: {nlogs.length} 次</p>
          </Space>
          <p>
            总门票: {mxlist.reduce((pre, item) => pre + item.moneys, 0)} 金币{" "}
            {"   "}
            {mxlist.reduce((pre, item) => pre + item.coins, 0)} BNX (你的余额:
            {gold} 金币 {bnx} BNX)
          </p>
          各等级次数:{" "}
          <p style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
            <Space style={{display: 'flex', flexWrap: 'wrap', width: 250, justifyContent: 'center'}}>
              <Tag color="green">
                1级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 1 ? item.num : pre + 0),
                  0
                )}
                次
              </Tag>
              <Tag color="yellow">
                2级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 2 ? item.num : pre + 0),
                  0
                )}{" "}
                次
              </Tag>
              <Tag color="red">
                3级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 3 ? item.num : pre + 0),
                  0
                )}{" "}
                次
              </Tag>
              <Tag color="green">
                4级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 4 ? item.num : pre + 0),
                  0
                )}
                次
              </Tag>
              <Tag color="yellow">
                5级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 5 ? item.num : pre + 0),
                  0
                )}{" "}
                次
              </Tag>
              <Tag color="red">
                6级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 6 ? item.num : pre + 0),
                  0
                )}{" "}
                次
              </Tag>
              <Tag color="green">
                7级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 7 ? item.num : pre + 0),
                  0
                )}
                次
              </Tag>
              <Tag color="yellow">
                8级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 8 ? item.num : pre + 0),
                  0
                )}{" "}
                次
              </Tag>
              <Tag color="red">
                9级{" "}
                {mxlist.reduce(
                  (pre, item) => (pre + item.lv == 9 ? item.num : pre + 0),
                  0
                )}{" "}
                次
              </Tag>
            </Space>
          </p>
          <p style={{ marginTop: 5 }}>
            <span style={{ marginRight: 5 }}>待领取奖励:</span>
            <Space>
              <Tag color="red">
                BNX {nlogs.reduce((pre, item) => pre + item.reward_coin, 0)}
              </Tag>
              <Tag color="yellow">
                金币 {nlogs.reduce((pre, item) => pre + item.reward_money, 0)}
              </Tag>
              <Tag>
                钥匙 {nlogs.reduce((pre, item) => pre + item.reward_coupon, 0)}
              </Tag>
            </Space>
          </p>
          {gameLoadSpin ? (
            <div
              style={{
                marginTop: 20,
                fontWeight: "bold",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {" "}
              冒险中,请不要关闭网页 <Spin style={{ marginLeft: 10 }} />
            </div>
          ) : (
            <></>
          )}
        </div>
      </Modal>
    </MyHeroContainer>
  );
};

export default MaoXian;
