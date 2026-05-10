# Cache Implementation Guide

O sistema de cache inteligente foi implementado com as seguintes características:

## Componentes

### 1. **CacheService** (`src/services/cache.service.ts`)
- Armazena dados em memória usando um `Map<string, CacheEntry>`
- Suporta **tags para invalidação granular** de cache
- Métodos principais:
  - `set<T>(key, value, tags[], ttl?)` — armazena valor com tags e TTL opcional
  - `get<T>(key)` — recupera valor (retorna undefined se expirou)
  - `invalidate(tags[])` — deleta todas as chaves com uma ou mais das tags
  - `stats()` — retorna info sobre uso de memória

### 2. **Cache Invalidation Middleware** (`src/config/cacheInvalidation.ts`)
- Middleware automático do Prisma que invalida cache ao executar `create`, `update`, `upsert`, `delete`
- Detecta o modelo e as tags relevantes para invalidação inteligente
- Sem necessidade de lógica manual em cada service

### 3. **CacheModule** (`src/modules/cache.module.ts`)
- Provê `CacheService` para todos os modules que a importarem

## Como Integrar em um Service

### Exemplo: `InvoiceService`

```typescript
import { CacheService } from "./cache.service";

@Injectable()
export class InvoiceService {
  constructor(private readonly cacheService: CacheService) {}

  async findById(id: string): Promise<ICardInvoice> {
    const cacheKey = `invoice:${id}`;
    
    // Tenta cache
    const cached = this.cacheService.get<ICardInvoice>(cacheKey);
    if (cached) return cached;

    // Se não estiver em cache, busca no DB
    const row = await prisma.cardInvoice.findUnique({ where: { id } });
    if (!row) notFound();
    
    const invoice = mapInvoice(row);
    
    // Armazena em cache com tags para invalidação
    this.cacheService.set(
      cacheKey,
      invoice,
      ["invoice", `invoice:${id}`, `user:${invoice.userId}:invoices`]
    );
    
    return invoice;
  }

  async getAllWithExpenses(userId?: string): Promise<ICardInvoice[]> {
    const cacheKey = userId ? `user:${userId}:invoices:all` : "invoices:all";
    
    const cached = this.cacheService.get<ICardInvoice[]>(cacheKey);
    if (cached) return cached;

    // ... buscar do DB ...
    
    const invoices = rows.map(mapInvoice);
    
    // Tags: modelo genérico + user-específico
    const tags = ["invoice"];
    if (userId) tags.push(`user:${userId}:invoices`);
    
    this.cacheService.set(cacheKey, invoices, tags);
    return invoices;
  }
}
```

### Step-by-step

1. **Injetar `CacheService`** no construtor do service
2. **Importar `CacheModule`** no module (`src/modules/invoice.module.ts`)
3. **Em métodos de leitura** (find, get, list):
   - Gerar chave única (ex: `invoice:${id}` ou `user:${userId}:invoices`)
   - Tentar buscar do cache
   - Se cache miss, buscar do DB
   - Armazenar no cache com tags relevantes
4. **Métodos de escrita** (create, update, delete) — **não precisam fazer nada**, o middleware cuidará de invalidar

## Exemplo de Invalidação Automática

Quando você faz:
```typescript
await prisma.cardInvoice.update({ where: { id }, data: { ... } });
```

O middleware automáticamente:
1. Detecta que é um `update` no modelo `CardInvoice`
2. Invalida todas as chaves com tags: `["invoice", `invoice:${id}`, `user:${userId}:invoices`]`
3. Na próxima leitura, os dados são refetchados do DB e re-cacheados

## Tag Conventions

- **Modelo genérico**: `invoice`, `expense`, `user`, etc.
- **Por ID**: `invoice:123`, `user:456`
- **Por usuário**: `user:456:invoices`, `user:456:expenses`
- **Por relacionamento**: `invoice:789:expenses`

## Estatísticas de Cache

Para monitorar o cache:
```typescript
const stats = cacheService.stats();
// {
//   totalKeys: 42,
//   totalTags: 15,
//   memory: 0.5  // MB
// }
```

## Performance

- **Cache hit**: ~0ms (operação de Map)
- **Cache miss**: tempo de DB query (usual)
- **Memory overhead**: Mínimo — apenas dados cacheados
- **Invalidação**: O(n) onde n = tags a serem procuradas

## Próximas Etapas

Integrar cache nos demais services:
- [ ] `ExpenseService`
- [ ] `FixedExpenseService`
- [ ] `FreelanceInvoiceService`
- [ ] `AuthService` (para cache de challenges, passkeys)

Padrão é idêntico ao exemplo acima — adicionar linhas de cache hit/miss em métodos de leitura.
