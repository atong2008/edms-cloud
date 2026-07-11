package com.edmscloud.edms.admin.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.edmscloud.edms.admin.api.entity.SysI18nEntity;
import com.edmscloud.edms.common.core.util.R;

import java.util.Map;

public interface SysI18nService extends IService<SysI18nEntity> {

	Map listMap();

	/**
	 * 同步数据
	 * @return R
	 */
	R syncI18nCache();

}
