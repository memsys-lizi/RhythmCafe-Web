import { ref } from 'vue'

export type PageName = 'home' | 'about'

export function useRouter() {
  const currentPage = ref<PageName>('home')

  const navigateTo = (page: PageName) => {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    currentPage,
    navigateTo
  }
}
