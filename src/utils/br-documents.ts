export const normalizeCpf = (value: string): string => value.replace(/\D/g, "");

export const normalizeRg = (value: string): string =>
  value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();

export const isValidCpf = (value: string): boolean => {
  const cpf = normalizeCpf(value);

  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string, factor: number): number => {
    let total = 0;
    for (const char of base) {
      total += Number(char) * factor;
      factor -= 1;
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cpf.slice(0, 9), 10);
  const secondDigit = calcDigit(`${cpf.slice(0, 9)}${firstDigit}`, 11);

  return cpf === `${cpf.slice(0, 9)}${firstDigit}${secondDigit}`;
};

export const isValidRg = (value: string): boolean => {
  const rg = normalizeRg(value);
  return /^[0-9A-Za-z]{5,20}$/.test(rg);
};
