package com.ascendons.admin.mapper;

import com.ascendons.admin.dto.AdminResponse;
import com.ascendons.admin.entity.Admin;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AdminMapper {
    AdminResponse toResponse(Admin admin);
}
