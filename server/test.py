import pandas as pd

df = pd.read_csv("C:/Users/gabri/Desktop/SGA/server/padron_25_filtrado.csv")
df = df.drop_duplicates(subset="identification")

df.to_csv("padron_sin_repetidos.csv")