export function ScopeSelect({ hasCouple, defaultValue = "pessoal" }: { hasCouple: boolean; defaultValue?: "pessoal" | "casal" }) {
  return (
    <div>
      <label className="label" htmlFor="scope">De quem é</label>
      <select className="input" id="scope" name="scope" defaultValue={hasCouple ? defaultValue : "pessoal"}>
        <option value="pessoal">Só meu (pessoal)</option>
        <option value="casal" disabled={!hasCouple}>
          Nosso (casal){hasCouple ? "" : " – conecte-se ao seu par primeiro"}
        </option>
      </select>
    </div>
  );
}
