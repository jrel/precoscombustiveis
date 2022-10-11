import { Box } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { red } from "@mui/material/colors";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import formatDuration from "date-fns/formatDuration";
import intervalToDuration from "date-fns/intervalToDuration";
import type { GetServerSideProps, NextPage } from "next";
import { useMemo, useState } from "react";
const IDS = [
  { id: "66626", descontos: { direto: 0.06 } },
  { id: "93023", descontos: { direto: 0 } },
  { id: "65215", descontos: { direto: 0.06 } },
];
const HumanDuration = ({ date }: { date: string }) => {
  const [showFullDate, setShowFullDate] = useState(false);
  const duration = useMemo(
    () =>
      Array.from(
        formatDuration(
          intervalToDuration({
            start: new Date(
              +date.slice(6, 10),
              +date.slice(3, 5) - 1,
              +date.slice(0, 2),
              +date.slice(11, 13),
              +date.slice(14, 16)
            ),
            end: new Date(),
          }),
          { zero: true }
        ).matchAll(/(\d+ \w+)/g)
      )
        .map(([v]) => v)
        .filter((v) => !v.startsWith("0"))
        .slice(0, 2)
        .join(" "),
    [date]
  );
  return (
    <Box onClick={() => setShowFullDate((v) => !v)}>
      {showFullDate ? date : duration}
    </Box>
  );
};
interface IndexProps {
  postos: Array<{
    id: string;
    Marca: string;
    Nome: string;
    Preco: string | null;
    PrecoFinal: string;
    DataAtualizacao: string;
  }>;
}
export const getServerSideProps: GetServerSideProps<IndexProps> = async (
  context
) => {
  interface APIResponse {
    resultado: {
      Marca: string;
      Nome: string;
      Combustiveis: Array<{
        TipoCombustivel: string;
        Preco: string;
      }>;
      DataAtualizacao: string;
    };
  }

  return {
    props: {
      postos: await Promise.all(
        IDS.map(({ id, descontos }) =>
          fetch(
            `https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/GetDadosPostoMapa?id=${id}&f=json`
          )
            .then((res) => res.json())
            .then(
              ({
                resultado: { Marca, Nome, Combustiveis, DataAtualizacao },
              }: APIResponse) => {
                const Combustivel = Combustiveis.find(
                  ({ TipoCombustivel }) =>
                    TipoCombustivel === "Gasolina simples 95"
                )!;

                const Preco = precoCastToNumber(Combustivel.Preco);
                return {
                  id,
                  Marca,
                  Nome,
                  Preco:
                    descontos.direto === 0 ? null : precoCastToString(Preco),
                  PrecoFinal: precoCastToString(Preco - descontos.direto),
                  DataAtualizacao,
                };
              }
            )
        )
      ),
    },
  };
};

const Index: NextPage<IndexProps> = ({ postos }) => {
  return (
    <List>
      {postos.map((posto) => (
        <ListItem
          key={posto.id}
          secondaryAction={
            <Box sx={{ textAlign: "right" }}>
              <Typography>{posto.PrecoFinal}</Typography>

              <Typography
                sx={{ display: "block" }}
                component="span"
                variant="caption"
                color={red[500]}
              >
                {posto.Preco ?? ""}
              </Typography>
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar
              alt={posto.Marca}
              src={`/static/images/${posto.Marca.toLocaleLowerCase()}.png`}
              variant="rounded"
              imgProps={{
                sx: {
                  objectFit: "contain",
                },
              }}
            />
          </ListItemAvatar>
          <ListItemText
            primary={`${posto.Marca} ${posto.Nome}`}
            secondary={
              <HumanDuration date={posto.DataAtualizacao}></HumanDuration>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default Index;

function precoCastToNumber(Preco: string) {
  return +Preco.replace(" €/litro", "").replace(",", ".");
}
function precoCastToString(Preco: number) {
  return Preco.toFixed(3) + " €/litro";
}
