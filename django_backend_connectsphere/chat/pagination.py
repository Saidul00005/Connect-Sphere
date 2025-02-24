from rest_framework.pagination import PageNumberPagination
# from rest_framework.response import Response
from rest_framework.pagination import CursorPagination
from urllib.parse import urlparse

# class CustomPagination(PageNumberPagination):
#     page_size = 10 
#     page_query_param = 'page'  
#     page_size_query_param = 'size'  
#     max_page_size = 30 


#     def get_paginated_response(self, data):
#         request = self.request
#         base_url = request.build_absolute_uri('/') 

#         next_page = self.get_next_link()
#         previous_page = self.get_previous_link()

#         if next_page:
#             next_page = next_page.replace(base_url.rstrip('/'), '')  
#         if previous_page:
#             previous_page = previous_page.replace(base_url.rstrip('/'), '')

#         return Response({
#             'count': self.page.paginator.count,
#             'next': next_page,  
#             'previous': previous_page,  
#             'results': data
#         })

class BaseCursorPagination(CursorPagination):
    page_size = 10 
    
    def _make_relative_url(self, link):
        if not link:
            return None
        parsed = urlparse(link)
        relative_url = parsed.path
        if parsed.query:
            relative_url += f'?{parsed.query}'
        return relative_url

    def get_next_link(self):
        return self._make_relative_url(super().get_next_link())

    def get_previous_link(self):
        return self._make_relative_url(super().get_previous_link())


class CursorMessagePagination(BaseCursorPagination):
    ordering = '-timestamp' 


class CursorChatroomPagination(BaseCursorPagination):
    ordering = ('-last_message__timestamp','-created_at', '-id')  
    # page_size = 6  # Uncomment to override default page size for this class