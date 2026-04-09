export const formatBRLInput = (value: string | number): string => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, '');
  
  // Converte para número dividindo por 100 (para considerar os centavos)
  const numberValue = parseInt(digits, 10) / 100;
  
  if (isNaN(numberValue)) return '0,00';
  
  return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseBRLInput = (value: string): number => {
  const digits = value.replace(/\D/g, '');
  return (parseInt(digits, 10) / 100) || 0;
};
