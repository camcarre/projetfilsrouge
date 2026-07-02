type Props = {
  /** Ce qui tourne derrière le graphe : modèle, méthode, source. */
  label: string
}

/**
 * Petit badge de transparence affiché sous un graphique : indique le moteur
 * réel derrière la donnée (modèle ML, méthode statistique, source de données).
 */
export function MethodTag({ label }: Props) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
      <span className="uppercase tracking-wider text-[10px] text-neutral-400 dark:text-neutral-500">Moteur</span>
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    </p>
  )
}
