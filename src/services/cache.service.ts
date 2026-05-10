import { Injectable } from "@nestjs/common";

export interface CacheEntry<T> {
  value: T;
  tags: Set<string>;
  createdAt: number;
  ttl?: number;
}

/**
 * Cache Service — gerencia cache em memória com invalidação inteligente por tags.
 * Exemplo de uso:
 *   cache.set('user:123', userData, ['user', 'user:123']);
 *   const data = cache.get('user:123');
 *   cache.invalidate(['user:123']); // invalida apenas esse user
 *   cache.invalidate(['user']); // invalida todos os users
 */
@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys

  /**
   * Armazena valor no cache com tags para invalidação.
   * @param key Chave única para o valor (ex: 'user:123', 'invoices:userId:456')
   * @param value Valor a ser cacheado
   * @param tags Array de tags para invalidação granular (ex: ['user', 'user:123', 'profile'])
   * @param ttl TTL em ms (opcional; se não definido, cache não expira por tempo)
   */
  set<T>(key: string, value: T, tags: string[] = [], ttl?: number): void {
    const tagSet = new Set(tags);
    this.cache.set(key, { value, tags: tagSet, createdAt: Date.now(), ttl });

    // Atualizar índice de tags
    tagSet.forEach((tag) => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  /**
   * Recupera valor do cache.
   * @param key Chave a procurar
   * @returns Valor cacheado ou undefined se expirou ou não existe
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;

    // Verificar TTL
    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Verifica se chave existe no cache.
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Deleta valor específico e remove das tags.
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Remover de índice de tags
    entry.tags.forEach((tag) => {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    });

    return this.cache.delete(key);
  }

  /**
   * Invalida (deleta) todas as chaves com uma ou mais das tags.
   * @param tags Array de tags a procurar
   * @example
   *   cache.invalidate(['user:123']); // invalida só esse user
   *   cache.invalidate(['user']); // invalida todos os users
   *   cache.invalidate(['invoice', 'expense']); // invalida invoices e expenses
   */
  invalidate(tags: string[]): number {
    const keysToDelete = new Set<string>();

    tags.forEach((tag) => {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.forEach((key) => keysToDelete.add(key));
      }
    });

    keysToDelete.forEach((key) => this.delete(key));
    return keysToDelete.size;
  }

  /**
   * Limpa todo o cache.
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  /**
   * Retorna estatísticas do cache.
   */
  stats() {
    return {
      totalKeys: this.cache.size,
      totalTags: this.tagIndex.size,
      memory: Math.round((Buffer.byteLength(JSON.stringify({
        cache: Array.from(this.cache.entries()),
        tagIndex: Array.from(this.tagIndex.entries()),
      })) / 1024 / 1024) * 100) / 100, // MB
    };
  }
}
