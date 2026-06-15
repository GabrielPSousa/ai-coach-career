# React Hooks e Otimização de Performance

## Introdução aos Hooks
Os React Hooks permitem que você use estado e outros recursos do React sem escrever uma classe. Introduzidos no React 16.8, eles facilitam o compartilhamento de lógica de estado entre componentes de forma limpa e reutilizável.

## Principais Hooks do React

### 1. useState
Permite gerenciar estado local em componentes funcionais.
```tsx
const [count, setCount] = useState<number>(0);
```

### 2. useEffect
Para executar efeitos colaterais (chamadas de API, inscrições, manipulação manual do DOM).
```tsx
useEffect(() => {
  console.log("Componente montado ou count alterado");
  return () => console.log("Limpeza do efeito");
}, [count]); // Array de dependências
```

### 3. useContext
Permite assinar o contexto do React sem introduzir aninhamento.
```tsx
const theme = useContext(ThemeContext);
```

## Otimização de Performance

### useMemo
Memoriza um valor calculado de forma cara, recalculando-o apenas quando uma das dependências mudar. Evita cálculos desnecessários a cada renderização.
```tsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### useCallback
Retorna uma versão memorizada de uma função de callback que só muda se uma das dependências for alterada. É essencial ao passar funções como callbacks para componentes filhos otimizados (que usam `React.memo`) para evitar renderizações extras.
```tsx
const handleClick = useCallback(() => {
  doSomething(a);
}, [a]);
```

## Regras dos Hooks
1. **Apenas chame Hooks no nível superior**: Não chame Hooks dentro de loops, regras condicionais ou funções aninhadas.
2. **Apenas chame Hooks de funções React**: Chame-os de componentes funcionais ou de custom hooks personalizados.
