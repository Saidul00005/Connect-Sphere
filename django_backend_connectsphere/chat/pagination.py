from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
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

class CursorMessagePagination(CursorPagination):
    page_size = 10          
    ordering = '-timestamp'    

    # Optionally, you can allow the client to adjust the page size:
    # page_size_query_param = 'page_size'
    # max_page_size = 100

    def get_next_link(self):
        next_link = super().get_next_link()
        if not next_link:
            return None
        parsed = urlparse(next_link)
        relative_url = parsed.path
        if parsed.query:
            relative_url += f'?{parsed.query}'
        return relative_url

    def get_previous_link(self):
        previous_link = super().get_previous_link()
        if not previous_link:
            return None
        parsed = urlparse(previous_link)
        relative_url = parsed.path
        if parsed.query:
            relative_url += f'?{parsed.query}'
        return relative_url


class CursorChatroomPagination(CursorPagination):
    page_size = 10     
    ordering = 'last_modified_at','id'   

    # Optionally, you can allow the client to adjust the page size:
    # page_size_query_param = 'page_size'
    # max_page_size = 100

    def get_next_link(self):
        next_link = super().get_next_link()
        if not next_link:
            return None
        parsed = urlparse(next_link)
        relative_url = parsed.path
        if parsed.query:
            relative_url += f'?{parsed.query}'
        return relative_url

    def get_previous_link(self):
        previous_link = super().get_previous_link()
        if not previous_link:
            return None
        parsed = urlparse(previous_link)
        relative_url = parsed.path
        if parsed.query:
            relative_url += f'?{parsed.query}'
        return relative_url