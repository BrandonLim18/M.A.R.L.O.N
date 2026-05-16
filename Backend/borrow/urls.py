from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BorrowingViewSet, HistoryViewSet, KnowledgeBaseView, ChatbotView

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'borrowings', BorrowingViewSet)
router.register(r'history', HistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatbotView.as_view()),
    path('knowledge/', KnowledgeBaseView.as_view()),
]