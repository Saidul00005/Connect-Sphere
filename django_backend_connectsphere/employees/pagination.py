from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from urllib.parse import urlparse

class CustomPagination(PageNumberPagination):
    page_size = 10
    page_query_param = 'page'
    page_size_query_param = 'size'
    max_page_size = 30

    def get_paginated_response(self, data):
        request = self.request
        base_url = request.build_absolute_uri('/') 

        next_page = self.get_next_link()
        previous_page = self.get_previous_link()

        if next_page:
            next_page = next_page.replace(base_url.rstrip('/'), '')  
        if previous_page:
            previous_page = previous_page.replace(base_url.rstrip('/'), '')

        return Response({
            'count': self.page.paginator.count,
            'next': next_page,  
            'previous': previous_page,  
            'results': data
        })
